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
        message.setSubject("Mã xác thực tài khoản ElectroMart"); // Tiêu đề là gì?
        
        // Nội dung bức thư (Dùng dấu + và \n để nối chữ và xuống dòng cho đẹp)
        message.setText("Xin chào,\n\n"
                + "Mã OTP để xác thực tài khoản của bạn là: " + otpCode + "\n\n"
                + "Vui lòng không chia sẻ mã này cho bất kỳ ai. Mã sẽ hết hạn sau 5 phút.\n\n"
                + "Trân trọng,\nĐội ngũ ElectroMart.");

        // Bước C: Đưa tờ giấy cho Bưu điện gửi đi
        mailSender.send(message);
    }
}