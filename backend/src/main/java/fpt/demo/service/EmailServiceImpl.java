package fpt.demo.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    // 1. GỌI BƯU ĐIỆN VÀO LÀM VIỆC
    // Nhờ @RequiredArgsConstructor, Spring Boot sẽ tự động cung cấp công cụ này
    private final JavaMailSender mailSender;

    // 2. HÀM GỬI THƯ (Nhận vào Email người nhận và Mã OTP)
    public void sendOtpEmail(String toEmail, String otpCode) {
        
        // Bước A: Lấy một tờ giấy trắng ra
        SimpleMailMessage message = new SimpleMailMessage();
        
        // Bước B: Điền thông tin vào tờ giấy
        message.setTo(toEmail); // Gửi cho ai?
        message.setSubject("ElectroMart account verification code"); // Tiêu đề là gì?
        
        // Nội dung bức thư (Dùng dấu + và \n để nối chữ và xuống dòng cho đẹp)
        message.setText("Hello,\n\n"
                + "Your ElectroMart account verification code is: " + otpCode + "\n\n"
                + "Please do not share this code with anyone. It will expire in 5 minutes.\n\n"
                + "Best regards,\nThe ElectroMart Team.");

        // Bước C: Đưa tờ giấy cho Bưu điện gửi đi
        mailSender.send(message);
    }
}