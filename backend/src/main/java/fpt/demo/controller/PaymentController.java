package fpt.demo.controller;

import fpt.demo.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.net.URI;
import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/users/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @GetMapping("/create")
    public ResponseEntity<?> createPayment(
            Principal principal,
            @RequestParam Integer orderId,
            @RequestParam String method) {

        if (principal == null) return ResponseEntity.status(401).body("Please log in to continue!");

        String url = paymentService.createPaymentUrl(orderId, method);
        
        if (url != null) {
            return ResponseEntity.ok(Map.of("paymentUrl", url));
        } else {
            // Nếu là COD, báo cho Frontend biết để chuyển sang trang hoàn tất đơn hàng
            return ResponseEntity.ok(Map.of("message", "Đơn hàng COD đã được ghi nhận"));
        }
    }

//    @GetMapping("/paypal-callback")
//    public ResponseEntity<Void> paypalCallback(@RequestParam String token, @RequestParam Integer orderId) {
//        boolean success = paymentService.processPayPalCallback(token, orderId);
//        
//        String redirectUrl = success 
//                ? "http://localhost:3000/checkout/success" 
//                : "http://localhost:3000/checkout/failure";
//                
//        return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(redirectUrl)).build();
//    }
    
    @GetMapping("/paypal-callback")
public ResponseEntity<Void> paypalCallback(
        @RequestParam("token") String token, 
        @RequestParam("orderId") Integer orderId,
        @RequestParam(value = "PayerID", required = false) String payerId) {
    
    // Gọi service để thực hiện capture và cập nhật DB
    boolean success = paymentService.processPayPalCallback(token, orderId);
    
    // Redirect về Frontend kèm theo orderId để hiển thị thông tin kết quả
    String redirectUrl = success 
            ? "http://localhost:5173/checkout/success?orderId=" + orderId 
            : "http://localhost:5173/checkout/failure?orderId=" + orderId;
                
    return ResponseEntity.status(HttpStatus.FOUND)
            .location(URI.create(redirectUrl))
            .build();
}
}