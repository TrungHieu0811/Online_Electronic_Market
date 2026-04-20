package fpt.demo.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import fpt.demo.dto.AdminCreationDto;
import fpt.demo.dto.GoogleLoginRequestDto;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import fpt.demo.dto.LoginRequestDto;
import fpt.demo.dto.UserRegistrationDto;
import fpt.demo.entity.RefreshToken;
import fpt.demo.entity.Role;
import fpt.demo.entity.User;
import fpt.demo.jwt.JwtService;
import fpt.demo.repository.RefreshTokenRepository;
import fpt.demo.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    @Value("${google.client.id}")
    private String googleClientId;

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final EmailService emailService;

    @Transactional
    public void changePassword(String username, String newPassword) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Admin not found!"));

        // Cập nhật và mã hóa mật khẩu mới
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    public Map<String, String> loginWithGoogle(GoogleLoginRequestDto requestDto) throws Exception {
        // 1. Cấu hình công cụ xác minh của Google
        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                .setAudience(Collections.singletonList(googleClientId))
                .build();

        // 2. Xác thực Token từ React gửi lên
        GoogleIdToken idToken = verifier.verify(requestDto.getToken());
        if (idToken == null) {
            throw new RuntimeException("Token Google không hợp lệ hoặc đã hết hạn!");
        }

        // 3. Rút trích thông tin người dùng
        GoogleIdToken.Payload payload = idToken.getPayload();
        String email = payload.getEmail();
        String name = (String) payload.get("name");
        String pictureUrl = (String) payload.get("picture");

        // 4. Tìm User trong DB
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            // TẠO MỚI USER NẾU CHƯA TỒN TẠI
            user = new User();
            user.setEmail(email);
            user.setUsername(email);
            user.setFullName(name);
            user.setAvatarUrl(pictureUrl);
            user.setStatus(true); // Kích hoạt tài khoản luôn

            // Encode một mật khẩu ngẫu nhiên (User Google không dùng mật khẩu này để đăng nhập)
            user.setPassword(passwordEncoder.encode("GOOGLE_OAUTH_" + Math.random()));

            // Nếu User entity của bạn có Role, set mặc định là USER ở đây nhé
            // user.setRole(Role.USER); 
            user = userRepository.save(user);

            // Có thể dùng emailService để gửi mail Welcome ở đây nếu muốn
            // emailService.sendWelcomeEmail(user.getEmail(), user.getFullName());
        }

        // 5. Cấp phát Token bằng JwtService của bạn
        // (Giả định hàm generateToken nhận tham số là Entity User hoặc UserDetails)
        String accessToken = jwtService.generateToken(user);
        String refreshTokenString = jwtService.generateToken(user);

        // 6. Lưu Refresh Token xuống Database
        // (Sửa lại tên Class và hàm set cho khớp với Entity RefreshToken của bạn)
        RefreshToken refreshTokenEntity = new RefreshToken();
        refreshTokenEntity.setToken(refreshTokenString);
        refreshTokenEntity.setUser(user);
        // refreshTokenEntity.setExpiryDate(...); // Set hạn sử dụng nếu DB của bạn yêu cầu
        refreshTokenRepository.save(refreshTokenEntity);

        // 7. Đóng gói vào Map để trả về Frontend
        Map<String, String> response = new HashMap<>();
        response.put("token", accessToken);
        response.put("refreshToken", refreshTokenString);

        return response;
    }

    @Override
    @Transactional
    public String register(UserRegistrationDto request) {
        // 1. Kiểm tra mật khẩu khớp nhau
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("The verification password doesn't match!");
        }

        // 2. Tìm xem Email này đã tồn tại trong DB chưa
        Optional<User> existingUserOpt = userRepository.findByEmail(request.getEmail());
        User userToSave;

        if (existingUserOpt.isPresent()) {
            userToSave = existingUserOpt.get();

            // TRƯỜNG HỢP 1: Đã xác thực (Bị chốt sổ) -> Chặn luôn
            // if (userToSave.isEmailConfirmed()|| userToSave.isStatus()) {
            if (userToSave.getEmailConfirmed()) {
                throw new IllegalArgumentException("Email already exists in the system!");
            }

            // TRƯỜNG HỢP 2: Chưa xác thực -> Cho phép Tái Chế
            // Nhưng phải cẩn thận: Lỡ họ đổi Username/Phone sang một số đang được người
            // khác dùng thì sao?
            // -> Kiểm tra xem Username/Phone mới có bị trùng với người khác không
            if (!userToSave.getUsername().equals(request.getUsername())
                    && userRepository.existsByUsername(request.getUsername())) {
                throw new IllegalArgumentException("The username already exists in the system!");
            }
            if (!userToSave.getPhone().equals(request.getPhone()) && userRepository.existsByPhone(request.getPhone())) {
                throw new IllegalArgumentException("Phone number is already in use!");
            }

            // Bắt đầu ghi đè thông tin mới lên cái xác cũ
            userToSave.setUsername(request.getUsername());
            userToSave.setFullName(request.getFullName());
            userToSave.setPhone(request.getPhone());
            userToSave.setPassword(passwordEncoder.encode(request.getPassword()));

        } else {
            // TRƯỜNG HỢP 3: Email mới hoàn toàn -> Kiểm tra Username/Phone như bình thường
            if (userRepository.existsByUsername(request.getUsername())) {
                throw new IllegalArgumentException("The username already exists in the system!");
            }
            if (userRepository.existsByPhone(request.getPhone())) {
                throw new IllegalArgumentException("Phone number is already in use!");
            }

            // Tạo một User mới tinh bằng Builder của bạn
            userToSave = User.builder()
                    .username(request.getUsername())
                    .email(request.getEmail())
                    .fullName(request.getFullName())
                    .phone(request.getPhone())
                    .password(passwordEncoder.encode(request.getPassword()))
                    .status(false)
                    .emailConfirmed(false)
                    .build();
        }

        // 3. TẠO MÃ OTP VÀ HẠN SỬ DỤNG (Dùng chung cho cả tạo mới lẫn tái chế)
        String otp = String.format("%06d", new java.util.Random().nextInt(999999));
        userToSave.setOtpCode(otp);
        userToSave.setOtpExpiration(java.time.LocalDateTime.now().plusMinutes(5));

        // 4. LƯU XUỐNG DATABASE
        userRepository.save(userToSave);

        // 5. GỌI BÁC ĐƯA THƯ
        emailService.sendOtpEmail(userToSave.getEmail(), otp);

        return "Registration successful! Please check your email for the verification code.";
    }

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestParam String email) {
        // 1. Tìm user theo email
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No account found with this email!"));

        // 2. Tạo mã OTP ngẫu nhiên 6 chữ số
        String otp = String.format("%06d", new Random().nextInt(999999));

        // 3. Lưu OTP và thời gian hết hạn (5 phút) vào Database
        user.setOtpCode(otp);
        user.setOtpExpiration(LocalDateTime.now().plusMinutes(5));
        userRepository.save(user);

        // 4. Gửi email
        try {
            emailService.sendOtpEmail(user.getEmail(), otp);
            return ResponseEntity.ok("OTP sent successfully to your email!");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error sending email: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public String createAdmin(AdminCreationDto request) {
        // 1. Kiểm tra trùng lặp
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username has already existed!");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email has already existed!");
        }
        
        // 👉 XỬ LÝ CHUỖI RỖNG CHO SỐ ĐIỆN THOẠI
        String finalPhone = request.getPhone();
        if (finalPhone != null && finalPhone.trim().isEmpty()) {
            finalPhone = null; // Chuyển chuỗi rỗng thành NULL
        }

        if (finalPhone != null && userRepository.existsByPhone(finalPhone)) {
            throw new IllegalArgumentException("Phone number has already existed!");
        }

        // 2. Tạo tài khoản Admin mới
        User newAdmin = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode("123"))
                .fullName(request.getFullName())
                .phone(finalPhone) // 👉 DÙNG BIẾN ĐÃ XỬ LÝ Ở ĐÂY
                .userRole(Role.ROLE_STAFF) 
                .status(true)
                .emailConfirmed(true)
                .build();

        // 3. Lưu xuống Database
        userRepository.save(newAdmin);

        return "Create admin successfully!";
    }

    @Override
    @Transactional
    public String[] login(LoginRequestDto request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()));

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("No account found with this username!"));

        if (!user.getStatus()) {
            throw new IllegalStateException("Your account has been locked. Please contact customer support.");
        }

        String jwtAccessToken = jwtService.generateToken(user);
        RefreshToken refreshToken = createRefreshToken(user);

        return new String[]{jwtAccessToken, refreshToken.getToken()};
    }

    // Hàm private giữ nguyên, không cần @Override vì không có trong Interface
    private RefreshToken createRefreshToken(User user) {
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setToken(UUID.randomUUID().toString());
        refreshToken.setExpiryDate(LocalDateTime.now().plusDays(7));
        return refreshTokenRepository.save(refreshToken);
    }

    @Override
    @Transactional
    public String[] refreshAccessToken(String refreshTokenReq) {
        // 1. Tìm Refresh Token trong DB
        // (Lưu ý: Đảm bảo trong RefreshTokenRepository của bạn đã có hàm
        // findByToken(String token) nhé)
        RefreshToken refreshTokenOpt = refreshTokenRepository.findByToken(refreshTokenReq)
                .orElseThrow(() -> new IllegalArgumentException("Refresh Token không tồn tại!"));

        // 2. Kiểm tra xem Token đã bị thu hồi chưa (nếu lỡ user bị ban hoặc tự log out)
        if (refreshTokenOpt.getIsRevoked()) {
            throw new IllegalArgumentException("Refresh Token đã bị thu hồi!");
        }

        // 3. Kiểm tra hạn sử dụng
        if (refreshTokenOpt.getExpiryDate().isBefore(LocalDateTime.now())) {
            // Nếu đã hết hạn thì xóa luôn rác trong DB
            refreshTokenRepository.delete(refreshTokenOpt);
            throw new IllegalArgumentException("Refresh Token đã hết hạn! Vui lòng đăng nhập lại.");
        }

        // 4. Lấy User từ Token
        User user = refreshTokenOpt.getUser();

        // 5. Tạo Access Token MỚI
        String newAccessToken = jwtService.generateToken(user);

        // Trả về một mảng chứa: [AccessToken Mới, RefreshToken Cũ (vẫn còn hạn)]
        return new String[]{newAccessToken, refreshTokenOpt.getToken()};
    }

    @Override
    @Transactional
    public String verifyEmail(String email, String otpCode) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("No account found with this email!"));

        // 1. Kiểm tra xem tài khoản đã xác thực chưa
        if (user.getStatus() && user.getEmailConfirmed()) {
            return "This account has already been verified.!";
        }

        // 2. Kiểm tra mã OTP và hạn sử dụng
        if (user.getOtpExpiration().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("OTP has expired! Please request a new one.");
        }
        if (!user.getOtpCode().equals(otpCode)) {
            throw new IllegalArgumentException("OTP is incorrect!");
        }

        // 3. Nếu đúng hết -> Mở khóa tài khoản
        user.setStatus(true);
        user.setEmailConfirmed(true);

        // 4. Dọn dẹp mã OTP cho sạch Database
        user.setOtpCode(null);
        user.setOtpExpiration(null);

        userRepository.save(user);
        return "Email verification successful! You can now log in.";
    }

    @Override
    @Transactional
    public String forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("No account found with this email!"));

        // Tạo OTP mới
        String otp = String.format("%06d", new java.util.Random().nextInt(999999));
        user.setOtpCode(otp);
        user.setOtpExpiration(LocalDateTime.now().plusMinutes(5));

        userRepository.save(user);

        // Gửi mail
        emailService.sendOtpEmail(user.getEmail(), otp);

        return "Password reset OTP has been sent to your email.";
    }

    @Override
    @Transactional
    public String resetPassword(String email, String otpCode, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("No account found with this email!"));

        if (user.getOtpExpiration().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("OTP has expired!");
        }
        if (!user.getOtpCode().equals(otpCode)) {
            throw new IllegalArgumentException("OTP is incorrect!");
        }

        // 👉 2. THÊM ĐOẠN KIỂM TRA MẬT KHẨU TRÙNG NHAU TẠI ĐÂY
        // Nếu mật khẩu mới khớp với mật khẩu đang lưu trong DB thì báo lỗi ngay
        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            throw new IllegalArgumentException("New password cannot be the same as the current password!");
        }

        // Đổi mật khẩu mới (Nhớ phải mã hóa)
        user.setPassword(passwordEncoder.encode(newPassword));

        // Xóa OTP
        user.setOtpCode(null);
        user.setOtpExpiration(null);

        userRepository.save(user);
        return "Password changed successfully! You can now log in with your new password.";
    }

    @Override
    @Transactional
    public String resendOtp(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("No account found with this email!"));

        if (user.getStatus() && user.getEmailConfirmed()) {
            throw new IllegalArgumentException("This account has already been verified!");
        }

        // Tạo OTP mới và gia hạn thêm 5 phút
        String otp = String.format("%06d", new java.util.Random().nextInt(999999));
        user.setOtpCode(otp);
        user.setOtpExpiration(LocalDateTime.now().plusMinutes(5));
        userRepository.save(user);

        // Gửi mail lại
        emailService.sendOtpEmail(user.getEmail(), otp);

        return "OTP has been resent to your email!";
    }

    @Override
    public String checkOtp(String email, String otpCode) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("No account found with this email!"));

        if (user.getOtpExpiration() == null || user.getOtpExpiration().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("OTP has expired! Please request a new one.");
        }
        if (!user.getOtpCode().equals(otpCode)) {
            throw new IllegalArgumentException("OTP is incorrect!");
        }

        return "OTP is valid!";
    }
}
