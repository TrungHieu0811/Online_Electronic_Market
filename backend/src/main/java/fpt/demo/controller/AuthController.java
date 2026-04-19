package fpt.demo.controller;

import fpt.demo.dto.ChangePasswordDto;
import fpt.demo.dto.GoogleLoginRequestDto;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import fpt.demo.dto.LoginRequestDto;
import fpt.demo.dto.UserRegistrationDto;
import fpt.demo.service.AuthServiceImpl;
import jakarta.validation.Valid;
import java.security.Principal;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PutMapping;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthServiceImpl authService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody UserRegistrationDto request) {
        try {
            String message = authService.register(request);
            return ResponseEntity.ok(Map.of("message", message));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequestDto request) {
        try {
            String[] tokens = authService.login(request);
            
            Map<String, String> response = new HashMap<>();
            // Đổi "accessToken" thành "token" để khớp với logic bóc tách ở Frontend
            response.put("token", tokens[0]); 
            response.put("refreshToken", tokens[1]);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", "Incorrect account, password, or account locked!"));
        }
    }
    
    @PostMapping("/google-login")
    public ResponseEntity<?> googleLogin(@RequestBody GoogleLoginRequestDto requestDto) {
        try {
            // Nhận Map chứa token và refreshToken
            Map<String, String> tokens = authService.loginWithGoogle(requestDto);
            
            // Trả về thẳng cho Frontend với HTTP Status 200 OK
            return ResponseEntity.ok(tokens);
        } catch (Exception e) {
            // Trả về lỗi 400 nếu Token hỏng hoặc cấu hình sai
            return ResponseEntity.badRequest().body("Đăng nhập Google thất bại: " + e.getMessage());
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@RequestBody Map<String, String> request) {
        String refreshToken = request.get("refreshToken");
        
        try {
            String[] tokens = authService.refreshAccessToken(refreshToken);
            
            Map<String, String> response = new HashMap<>();
            // Tương tự, dùng "token" cho đồng nhất
            response.put("token", tokens[0]); 
            response.put("refreshToken", tokens[1]);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestParam String email, @RequestParam String otp) {
        try {
            String message = authService.verifyEmail(email, otp);
            return ResponseEntity.ok(message);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    // API 2: Bấm nút "Quên mật khẩu"
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestParam String email) {
        try {
            String message = authService.forgotPassword(email);
            return ResponseEntity.ok(message);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // API 3: Nhập mã OTP và Mật khẩu mới
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestParam String email, 
                                           @RequestParam String otp, 
                                           @RequestParam String newPassword) {
        try {
            String message = authService.resetPassword(email, otp, newPassword);
            return ResponseEntity.ok(message);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp(@RequestParam String email) {
        try {
            String message = authService.resendOtp(email);
            return ResponseEntity.ok(message);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    @PostMapping("/check-otp")
    public ResponseEntity<?> checkOtp(@RequestParam String email, @RequestParam String otp) {
        try {
            String message = authService.checkOtp(email, otp);
            return ResponseEntity.ok(message);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @Valid @RequestBody ChangePasswordDto request, 
            Principal principal
    ) {
        // Principal sẽ tự động lấy username từ Token mà người dùng gửi kèm
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Phiên làm việc hết hạn, vui lòng đăng nhập lại!"));
        }

        try {
            // Gọi service xử lý đổi mật khẩu
            authService.changePassword(principal.getName(), request.getNewPassword());
            
            return ResponseEntity.ok(Map.of("message", "Đổi mật khẩu thành công!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Lỗi: " + e.getMessage()));
        }
    }
}
