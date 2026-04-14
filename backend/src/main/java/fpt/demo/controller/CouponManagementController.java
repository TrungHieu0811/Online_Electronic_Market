package fpt.demo.controller;

import fpt.demo.entity.CouponManagement;
import fpt.demo.service.CouponManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/coupon-logs")
@RequiredArgsConstructor
public class CouponManagementController {

    private final CouponManagementService managementService;

    // Lấy toàn bộ lịch sử quản lý coupon
    @GetMapping
    public ResponseEntity<List<CouponManagement>> getAllLogs() {
        return ResponseEntity.ok(managementService.getAllHistory());
    }

    // Lấy lịch sử thay đổi của một coupon cụ thể
    @GetMapping("/coupon/{couponId}")
    public ResponseEntity<List<CouponManagement>> getLogsByCoupon(@PathVariable Integer couponId) {
        return ResponseEntity.ok(managementService.getHistoryByCoupon(couponId));
    }
}