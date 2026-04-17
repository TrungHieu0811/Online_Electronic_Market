package fpt.demo.service;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;

public interface PaymentService {
   // Trả về URL thanh toán nếu là PayPal, hoặc trả về null/thông báo nếu là COD
    String createPaymentUrl(Integer orderId, String method);
    
    // Xử lý xác nhận tiền từ PayPal
    boolean processPayPalCallback(String token, Integer orderId);
    
    void handlePaymentCancellation(Integer orderId);
}