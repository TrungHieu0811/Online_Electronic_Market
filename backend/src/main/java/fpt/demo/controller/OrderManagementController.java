package fpt.demo.controller;

import fpt.demo.dto.OrderStatsDTO;
import fpt.demo.entity.Order;
import fpt.demo.entity.OrderItem;
import fpt.demo.entity.OrderManagement;
import fpt.demo.repository.OrderEvidenceRepository;
import fpt.demo.service.OrderEvidenceService;
import fpt.demo.service.OrderItemService;
import fpt.demo.service.OrderManagementService;
import java.security.Principal;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
public class OrderManagementController {

    private final OrderManagementService managementService;
    private final OrderEvidenceRepository evidenceRepository;
    private final OrderItemService orderItemService;

    // API dành cho nhân viên duyệt đơn hoặc hủy đơn
    @PatchMapping("/{orderId}/status")
    public ResponseEntity<String> changeStatus(
            Principal principal,
            @PathVariable Integer orderId,
            @RequestParam String newStatus,
            @RequestParam(required = false) String reason) {

        managementService.updateOrderStatus(orderId, principal.getName(), newStatus, reason);
        return ResponseEntity.ok("Order status updated successfully!");
    }

    // API xem lịch sử "ai đã làm gì" với đơn hàng này
    @GetMapping("/{orderId}/history")
    public ResponseEntity<List<OrderManagement>> getOrderHistory(@PathVariable Integer orderId) {
        return ResponseEntity.ok(managementService.getHistoryByOrder(orderId));
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<Order> getOrderDetails(@PathVariable Integer orderId) {
        // Phải gọi đúng hàm getOrderById mà bạn vừa viết trong Service
        Order order = managementService.getOrderById(orderId);
        return ResponseEntity.ok(order);
    }

    @GetMapping("")
    public ResponseEntity<Page<Order>> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "createdAt") String sortField,
            @RequestParam(defaultValue = "desc") String sortDir) {

        return ResponseEntity.ok(managementService.findAllOrders(page, size, status, sortField, sortDir));
    }

    @GetMapping("/{orderId}/items")
    public ResponseEntity<List<OrderItem>> getOrderItems(@PathVariable Integer orderId) {
        // Sử dụng OrderItemService Ngọc đã có
        return ResponseEntity.ok(orderItemService.getItemsByOrderId(orderId));
    }

    @GetMapping("/{orderId}/evidences")
    public ResponseEntity<?> getOrderEvidences(@PathVariable Integer orderId) {
        return ResponseEntity.ok(evidenceRepository.findByOrder_Id(orderId));
    }

//    @GetMapping("")
//    public ResponseEntity<List<OrderManagement>> getHistoryByAction(@RequestParam String actionType) {
//        return ResponseEntity.ok(managementService.getHistoryByActionType(actionType));
//    }
    @PostMapping("/{orderId}/refund-paypal")
    public ResponseEntity<?> refundPayPal(@PathVariable Integer orderId) {
        try {
            managementService.refundPayPalOrder(orderId);
            return ResponseEntity.ok(Map.of("message", "Refund processed successfully via PayPal!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/filter")
    public ResponseEntity<Page<Order>> searchOrders(
            @RequestParam String searchText, // Phải khớp 100% với Frontend
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        // Gọi đến hàm search trong Service (Ngọc đã viết Query trong OrderRepository rồi)
        // Lưu ý: Query của Ngọc đang nhận 2 tham số (id, shippingName)
        return ResponseEntity.ok(managementService.searchOrders(searchText, page, size));
    }

    @GetMapping("/stats")
    public ResponseEntity<OrderStatsDTO> getOrderStats() {
        return ResponseEntity.ok(managementService.getOrderStats());
    }
}
