package fpt.demo.service;
import java.util.List;
import fpt.demo.entity.Order;
import fpt.demo.entity.PaymentLogManagement;
import fpt.demo.repository.OrderRepository;
import fpt.demo.repository.PaymentLogManagementRepository;
import fpt.demo.service.PaymentLogManagementService;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PaymentLogManagementServiceImpl implements PaymentLogManagementService {

    private final PaymentLogManagementRepository paymentLogRepository;
    private final OrderRepository orderRepository;

    @Override
    @Transactional
    public PaymentLogManagement savePaymentLog(Integer orderId, String transId, Double amount,
            String provider, String status, String jsonResponse) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng để thanh toán"));

        // 1. Tạo bản ghi Log thanh toán
        PaymentLogManagement log = new PaymentLogManagement();
        log.setOrder(order);
        log.setTransactionId(transId);
        log.setAmount(amount);
        log.setProvider(provider); // VNPAY, PAYPAL...
        log.setStatus(status);     // SUCCESS, FAILED
        log.setResponseJson(jsonResponse); // Lưu nguyên mẫu JSON để đối soát khi có lỗi
        log.setCreatedAt(LocalDateTime.now());

        // 2. Nếu thanh toán THÀNH CÔNG, cập nhật trạng thái tiền trong Đơn hàng
        if ("SUCCESS".equalsIgnoreCase(status)) {
            order.setPaymentStatus("PAID");
            order.setOrderStatus(Order.OrderStatus.CONFIRMED);
            orderRepository.save(order);
        }

        return paymentLogRepository.save(log);
    }

    @Override
    public List<PaymentLogManagement> getLogsByOrder(Integer orderId) {
        return paymentLogRepository.findByOrder_IdOrderByCreatedAtDesc(orderId);
    }
}
