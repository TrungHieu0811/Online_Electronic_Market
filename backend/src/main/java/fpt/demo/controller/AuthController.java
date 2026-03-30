package fpt.demo.controller;

import fpt.demo.dto.LoginRequestDto;
import fpt.demo.dto.UserRegistrationDto;
import fpt.demo.service.AuthServiceImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

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
            // Lấy mảng 2 token từ AuthServiceImpl
            String[] tokens = authService.login(request);
            
            // Đóng gói thành dạng JSON chuẩn xác để Flutter/Web dễ đọc
            Map<String, String> response = new HashMap<>();
            response.put("accessToken", tokens[0]);
            response.put("refreshToken", tokens[1]);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", "Sai tài khoản, mật khẩu hoặc tài khoản bị khóa!"));
        }
    }
    // API 1: Xác thực lúc mới đăng ký
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
}