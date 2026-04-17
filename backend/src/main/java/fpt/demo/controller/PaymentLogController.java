package fpt.demo.controller;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import fpt.demo.entity.PaymentLogManagement;
import fpt.demo.service.PaymentLogManagementService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/payment-logs")
@RequiredArgsConstructor
public class PaymentLogController {

    private final PaymentLogManagementService paymentLogService;

    // Xem lịch sử thanh toán của 1 đơn hàng (Admin tra cứu khi khách khiếu nại)
    @GetMapping("/order/{orderId}")
    public ResponseEntity<List<PaymentLogManagement>> getLogs(@PathVariable Integer orderId) {
        return ResponseEntity.ok(paymentLogService.getLogsByOrder(orderId));
    }

    /* LƯU Ý: API 'savePaymentLog' thường không được gọi trực tiếp từ Client 
       mà sẽ được gọi nội bộ trong Controller xử lý Callback của VNPAY/Paypal.
    */
}