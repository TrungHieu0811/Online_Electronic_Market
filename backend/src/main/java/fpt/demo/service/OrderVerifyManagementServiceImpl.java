package fpt.demo.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import fpt.demo.entity.Order;
import fpt.demo.entity.OrderVerifyManagement;
import fpt.demo.entity.User;
import fpt.demo.repository.OrderRepository;
import fpt.demo.repository.OrderVerifyManagementRepository;
import fpt.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OrderVerifyManagementServiceImpl implements OrderVerifyManagementService {

    private final OrderVerifyManagementRepository verifyRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public OrderVerifyManagement logVerifyAttempt(Integer orderId, String adminUsername,
            String status, String note) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        User admin = userRepository.findByUsername(adminUsername)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy nhân viên"));

        // 1. Tính toán số lần gọi (Attempt Number)
        List<OrderVerifyManagement> existingLogs = verifyRepository.findByOrder_IdOrderByAttemptNumberDesc(orderId);
        int nextAttempt = existingLogs.isEmpty() ? 1 : existingLogs.get(0).getAttemptNumber() + 1;

        // Chuyển đổi String sang Enum
        OrderVerifyManagement.Status statusEnum;
        try {
            statusEnum = OrderVerifyManagement.Status.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Trạng thái xác minh không hợp lệ: " + status);
        }

        // 2. Tạo bản ghi Log xác minh
        OrderVerifyManagement verifyLog = new OrderVerifyManagement();
        verifyLog.setOrder(order);
        verifyLog.setAdmin(admin);
        verifyLog.setAttemptNumber(nextAttempt);
        verifyLog.setVerifyMethod("PHONE_CALL");
        verifyLog.setStatus(statusEnum); // SUCCESS, NO_ANSWER, WRONG_NUMBER, REJECTED
        verifyLog.setNote(note);
        verifyLog.setCreatedAt(LocalDateTime.now());

        // 3. Cập nhật trạng thái xác thực trong bảng Order
        if ("SUCCESS".equalsIgnoreCase(status)) {
            order.setVerifyStatus("VERIFIED");
            order.setOrderStatus(Order.OrderStatus.CONFIRMED);
        } else {
            order.setVerifyStatus("FAILED_VERIFY");
        }

        orderRepository.save(order);

        return verifyRepository.save(verifyLog);
    }

    @Override
    public List<OrderVerifyManagement> getVerifyHistory(Integer orderId) {
        return verifyRepository.findByOrder_IdOrderByAttemptNumberDesc(orderId);
    }
}