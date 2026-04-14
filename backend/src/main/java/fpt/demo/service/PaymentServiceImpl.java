package fpt.demo.service;

import fpt.demo.entity.Order;
import fpt.demo.entity.PaymentLogManagement;
import fpt.demo.repository.OrderRepository;
import fpt.demo.repository.PaymentLogManagementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final OrderRepository orderRepository;
    private final PaymentLogManagementRepository paymentLogRepository;
    private final PayPalService payPalService;

    @Override
    @Transactional
    public String createPaymentUrl(Integer orderId, String method) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        if ("PAYPAL".equalsIgnoreCase(method)) {
            return payPalService.createOrder(order.getTotalPayPrice(), order.getId());
        }

        return null;
    }

@Override
@Transactional
public boolean processPayPalCallback(String token, Integer orderId) {
    // Gọi sang PayPalService để chốt giao dịch thu tiền thật
    boolean isCaptured = payPalService.captureOrder(token);

    Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new RuntimeException("Đơn hàng không tồn tại"));

    PaymentLogManagement log = new PaymentLogManagement();
    log.setOrder(order);
    log.setTransactionId(token);
    log.setAmount(order.getTotalPayPrice());
    log.setProvider("PAYPAL");
    log.setCreatedAt(LocalDateTime.now());

    if (isCaptured) {
        order.setPaymentStatus("PAID");
        // Đảm bảo dùng Enum hằng số thay vì String "CONFIRMED"
        order.setOrderStatus(Order.OrderStatus.CONFIRMED); 
        order.setUpdatedAt(LocalDateTime.now());
        log.setStatus("SUCCESS");
        log.setResponseJson("PayPal Capture Completed Successfully");
    } else {
        log.setStatus("FAILED");
        log.setResponseJson("PayPal Capture Failed");
    }

    paymentLogRepository.save(log);
    orderRepository.save(order);
    return isCaptured;
}
}