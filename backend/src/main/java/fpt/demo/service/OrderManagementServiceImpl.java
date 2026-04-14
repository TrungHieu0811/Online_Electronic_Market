package fpt.demo.service;

import java.util.List;
import fpt.demo.entity.Order;
import fpt.demo.entity.OrderManagement;
import fpt.demo.entity.User;
import fpt.demo.repository.OrderManagementRepository;
import fpt.demo.repository.OrderRepository;
import fpt.demo.repository.UserRepository;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OrderManagementServiceImpl implements OrderManagementService {

    private final OrderManagementRepository managementRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public void updateOrderStatus(Integer orderId, String username, String newStatus, String reason) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        User admin = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy nhân viên"));

        // 1. Lưu trạng thái cũ
        String oldStatus = order.getOrderStatus().name();

        // 2. Convert String -> Enum
        Order.OrderStatus statusEnum;
        try {
            statusEnum = Order.OrderStatus.valueOf(newStatus.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Trạng thái đơn hàng không hợp lệ: " + newStatus);
        }

        // 3. Cập nhật trạng thái mới
        order.setOrderStatus(statusEnum);
        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);

        // 4. Ghi log
        OrderManagement log = new OrderManagement();
        log.setOrder(order);
        log.setAdmin(admin);
        log.setActionType(statusEnum.getRelatedAction());
        log.setPreviousStatus(oldStatus);
        log.setNewStatus(statusEnum.name());
        log.setReason(reason);
        log.setCreatedAt(LocalDateTime.now());

        managementRepository.save(log);
    }

    @Override
    public List<OrderManagement> getHistoryByActionType(String actionType) {
        // Chuyển về chữ hoa để khớp với dữ liệu thường lưu trong DB
        return managementRepository.findByActionTypeOrderByCreatedAtDesc(actionType.toUpperCase());
    }

    @Override
    public List<OrderManagement> getHistoryByOrder(Integer orderId) {
        return managementRepository.findByOrder_IdOrderByCreatedAtDesc(orderId);
    }
}
