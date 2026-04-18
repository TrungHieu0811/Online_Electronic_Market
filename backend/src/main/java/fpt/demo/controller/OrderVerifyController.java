package fpt.demo.controller;

import java.util.List;
import fpt.demo.service.OrderVerifyManagementService;
import java.security.Principal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import fpt.demo.entity.OrderVerifyManagement;

@RestController
@RequestMapping("/api/admin/order-verify")
@RequiredArgsConstructor
public class OrderVerifyController {

    private final OrderVerifyManagementService verifyService;

    // Ghi lại kết quả cuộc gọi xác minh
    @PostMapping("/{orderId}/log")
    public ResponseEntity<OrderVerifyManagement> logAttempt(
            Principal principal,
            @PathVariable Integer orderId,
            @RequestParam String status,
            @RequestParam(required = false) String note) {
        
        return ResponseEntity.ok(verifyService.logVerifyAttempt(orderId, principal.getName(), status, note));
    }

    // Xem lịch sử các lần gọi của đơn này
    @GetMapping("/{orderId}/history")
    public ResponseEntity<List<OrderVerifyManagement>> getHistory(@PathVariable Integer orderId) {
        return ResponseEntity.ok(verifyService.getVerifyHistory(orderId));
    }
}