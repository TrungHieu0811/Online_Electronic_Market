package fpt.demo.service;

import fpt.demo.dto.OrderStatsDTO;
import fpt.demo.entity.Order;
import fpt.demo.entity.OrderManagement;
import java.util.List;
import org.springframework.data.domain.Page;

public interface OrderManagementService {
    // Admin thay đổi trạng thái đơn hàng
    void updateOrderStatus(Integer orderId, String username, String newStatus, String reason);
    
    // Xem lịch sử thay đổi
    List<OrderManagement> getHistoryByOrder(Integer orderId);
    
//    List<OrderManagement> getHistoryByActionType(String actionType);
    
    Page<Order> findAllOrders(int page, int size, String status, String sortField, String sortDir);
    
    void processAIVerification(Integer orderId, String imageUrl, boolean isValid, String labels);
    
    void autoConfirmOrders();
    
    Order getOrderById(Integer orderId);
    
    void handleShipFailedToCancelled(Integer orderId, String reason);
    
    void refundPayPalOrder(Integer orderId);
    
    Page<Order> searchOrders(String searchText, int page, int size);
    
    OrderStatsDTO getOrderStats();
}