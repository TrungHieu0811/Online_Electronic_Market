package fpt.demo.service;

import fpt.demo.dto.LoginRequestDto;
import fpt.demo.dto.UserRegistrationDto;

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
}