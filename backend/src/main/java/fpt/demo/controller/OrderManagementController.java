package fpt.demo.controller;

import fpt.demo.entity.OrderManagement;
import fpt.demo.service.OrderManagementService;
import java.security.Principal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
public class OrderManagementController {

    private final OrderManagementService managementService;

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

    @GetMapping("")
    public ResponseEntity<List<OrderManagement>> getHistoryByAction(@RequestParam String actionType) {
        return ResponseEntity.ok(managementService.getHistoryByActionType(actionType));
    }
}
