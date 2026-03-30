package fpt.demo.service;

import fpt.demo.jwt.JwtService;
import fpt.demo.dto.LoginRequestDto;
import fpt.demo.dto.UserRegistrationDto;
import fpt.demo.entity.RefreshToken;
import fpt.demo.entity.User;
import fpt.demo.repository.RefreshTokenRepository;
import fpt.demo.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.Random;

import java.time.LocalDateTime;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final EmailService emailService;

    @Override
    @Transactional
    public String register(UserRegistrationDto request) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Mật khẩu xác nhận không khớp!");
        }
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username đã tồn tại trên hệ thống!");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email này đã được đăng ký!");
        }
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new IllegalArgumentException("Số điện thoại này đã được sử dụng!");
        }

        // 1. TẠO MÃ OTP NGẪU NHIÊN 6 SỐ
        // Đoạn code này sẽ random ra một số từ 0 đến 999999, nếu thiếu số 0 ở đầu nó sẽ tự bù vào cho đủ 6 số
        String otp = String.format("%06d", new java.util.Random().nextInt(999999));

        // 2. TẠO USER MỚI
        User newUser = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .password(passwordEncoder.encode(request.getPassword()))
                // Ép trạng thái là false (Bị khóa) và email chưa xác thực
                .status(false)
                .emailConfirmed(false)
                // Lưu mã OTP và thời gian hết hạn (5 phút) vào Database
                .otpCode(otp)
                .otpExpiration(java.time.LocalDateTime.now().plusMinutes(5))
                .build();

        // 3. LƯU XUỐNG DATABASE
        userRepository.save(newUser);

        // 4. GỌI BÁC ĐƯA THƯ GỬI MÃ OTP VÀO EMAIL CỦA USER VỪA ĐĂNG KÝ
        emailService.sendOtpEmail(newUser.getEmail(), otp);

        return "Đăng ký thành công! Vui lòng kiểm tra email để lấy mã xác thực.";
    }

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestParam String email) {
        // 1. Tìm user theo email
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản với email này!"));

        // 2. Tạo mã OTP ngẫu nhiên 6 chữ số
        String otp = String.format("%06d", new Random().nextInt(999999));

        // 3. Lưu OTP và thời gian hết hạn (5 phút) vào Database
        user.setOtpCode(otp);
        user.setOtpExpiration(LocalDateTime.now().plusMinutes(5));
        userRepository.save(user);

        // 4. Gửi email
        try {
            emailService.sendOtpEmail(user.getEmail(), otp);
            return ResponseEntity.ok("Đã gửi mã OTP đến email của bạn!");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi khi gửi email: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public String[] login(LoginRequestDto request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản."));

        if (!user.getStatus()) {
            throw new IllegalStateException("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ CSKH.");
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
    public String verifyEmail(String email, String otpCode) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy email này!"));

        // 1. Kiểm tra xem tài khoản đã xác thực chưa
        if (user.getStatus() && user.getEmailConfirmed()) {
            return "Tài khoản này đã được xác thực từ trước!";
        }

        // 2. Kiểm tra mã OTP và hạn sử dụng
        if (user.getOtpExpiration().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Mã OTP đã hết hạn! Vui lòng yêu cầu gửi lại.");
        }
        if (!user.getOtpCode().equals(otpCode)) {
            throw new IllegalArgumentException("Mã OTP không chính xác!");
        }

        // 3. Nếu đúng hết -> Mở khóa tài khoản
        user.setStatus(true);
        user.setEmailConfirmed(true);

        // 4. Dọn dẹp mã OTP cho sạch Database
        user.setOtpCode(null);
        user.setOtpExpiration(null);

        userRepository.save(user);
        return "Xác thực Email thành công! Bây giờ bạn có thể đăng nhập.";
    }

    @Override
    @Transactional
    public String forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản với email này!"));

        // Tạo OTP mới
        String otp = String.format("%06d", new java.util.Random().nextInt(999999));
        user.setOtpCode(otp);
        user.setOtpExpiration(LocalDateTime.now().plusMinutes(5));

        userRepository.save(user);

        // Gửi mail
        emailService.sendOtpEmail(user.getEmail(), otp);

        return "Mã xác thực đổi mật khẩu đã được gửi đến email của bạn.";
    }

    @Override
    @Transactional
    public String resetPassword(String email, String otpCode, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy email này!"));

        if (user.getOtpExpiration().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Mã OTP đã hết hạn!");
        }
        if (!user.getOtpCode().equals(otpCode)) {
            throw new IllegalArgumentException("Mã OTP không chính xác!");
        }
        
        // 👉 2. THÊM ĐOẠN KIỂM TRA MẬT KHẨU TRÙNG NHAU TẠI ĐÂY
        // Nếu mật khẩu mới khớp với mật khẩu đang lưu trong DB thì báo lỗi ngay
        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            throw new IllegalArgumentException("Mật khẩu mới không được trùng với mật khẩu hiện tại!");
        }

        // Đổi mật khẩu mới (Nhớ phải mã hóa)
        user.setPassword(passwordEncoder.encode(newPassword));

        // Xóa OTP
        user.setOtpCode(null);
        user.setOtpExpiration(null);

        userRepository.save(user);
        return "Đổi mật khẩu thành công! Bạn có thể đăng nhập với mật khẩu mới.";
    }
    @Override
    @Transactional
    public String resendOtp(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản!"));

        if (user.getStatus() && user.getEmailConfirmed()) {
            throw new IllegalArgumentException("Tài khoản này đã được xác thực từ trước!");
        }

        // Tạo OTP mới và gia hạn thêm 5 phút
        String otp = String.format("%06d", new java.util.Random().nextInt(999999));
        user.setOtpCode(otp);
        user.setOtpExpiration(LocalDateTime.now().plusMinutes(5));
        userRepository.save(user);

        // Gửi mail lại
        emailService.sendOtpEmail(user.getEmail(), otp);
        
        return "Đã gửi lại mã OTP mới vào email của bạn!";
    }
    @Override
    public String checkOtp(String email, String otpCode) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy email này!"));

        if (user.getOtpExpiration() == null || user.getOtpExpiration().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Mã OTP đã hết hạn! Vui lòng yêu cầu gửi lại.");
        }
        if (!user.getOtpCode().equals(otpCode)) {
            throw new IllegalArgumentException("Mã OTP không chính xác!");
        }

        return "Mã OTP hợp lệ!";
    }
}
