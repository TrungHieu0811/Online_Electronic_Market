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
    private final OrderService orderService;

    @Override
    @Transactional
    public String createPaymentUrl(Integer orderId, String method, String platform) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        if ("PAYPAL".equalsIgnoreCase(method)) {
            return payPalService.createOrder(order.getTotalPayPrice(), order.getId(),platform);
        }

        return null;
    }

    @Override
    @Transactional
    public boolean processPayPalCallback(String token, Integer orderId) {
        String captureId = payPalService.captureOrderAndGetId(token);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        PaymentLogManagement log = new PaymentLogManagement();
        log.setOrder(order);
        log.setTransactionId(token);
        log.setAmount(order.getTotalPayPrice());
        log.setCreatedAt(LocalDateTime.now());

        if (captureId != null) {
            log.setProvider(captureId);
            order.setPaymentStatus("PAID");
            order.setOrderStatus(Order.OrderStatus.CONFIRMED);
            log.setStatus("SUCCESS");
            log.setResponseJson("PayPal Capture Completed: " + captureId);
            paymentLogRepository.save(log);
            orderRepository.save(order);
            return true;
        } else {
            // FAILED CAPTURE CASE
            log.setProvider("PAYPAL");
            log.setStatus("FAILED");
            paymentLogRepository.save(log);

            // Trigger the automatic cancellation logic
            orderService.cancelOrderInternal(orderId, "Payment capture failed.");
            return false;
        }
    }

    @Override
    @Transactional
    public void handlePaymentCancellation(Integer orderId) {
        // Gọi trực tiếp logic hủy đơn, hoàn kho và hoàn coupon
        orderService.cancelOrderInternal(orderId, "Payment was cancelled by user on PayPal screen.");
    }
}
