package fpt.demo.service;

import fpt.demo.dto.AdminCreationDto;
import fpt.demo.dto.ChangePasswordDto;
import fpt.demo.dto.GoogleLoginRequestDto;
import fpt.demo.dto.LoginRequestDto;
import fpt.demo.dto.UserRegistrationDto;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;

public interface AuthService {

    String register(UserRegistrationDto request);

    String[] login(LoginRequestDto request);

    // Hàm xác thực email
    String verifyEmail(String email, String otpCode);

    // Hàm gửi mã OTP khi quên mật khẩu
    String forgotPassword(String email);

    // Hàm đặt lại mật khẩu mới
    String resetPassword(String email, String otpCode, String newPassword);

    String resendOtp(String email);

    String checkOtp(String email, String otpCode);

    // Hàm cấp lại Access Token mới dựa vào Refresh Token
    String[] refreshAccessToken(String refreshToken);

    String createAdmin(AdminCreationDto request);

    public void changePassword(String username, String newPassword);
    public Map<String, String> loginWithGoogle(GoogleLoginRequestDto requestDto) throws Exception;
}
