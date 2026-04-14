package fpt.demo.service;

import fpt.demo.entity.Order;
import fpt.demo.entity.OrderManagement;
import java.util.List;

public interface OrderManagementService {
    // Admin thay đổi trạng thái đơn hàng
    void updateOrderStatus(Integer orderId, String username, String newStatus, String reason);
    
    // Xem lịch sử thay đổi
    List<OrderManagement> getHistoryByOrder(Integer orderId);
    
    List<OrderManagement> getHistoryByActionType(String actionType);
}