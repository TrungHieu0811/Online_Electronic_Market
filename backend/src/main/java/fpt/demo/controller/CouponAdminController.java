package fpt.demo.controller;

import fpt.demo.entity.Coupon;
import fpt.demo.entity.User;
import fpt.demo.repository.UserRepository;
import fpt.demo.service.CouponService;
import java.security.Principal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/admin/coupons")
@RequiredArgsConstructor
public class CouponAdminController {

    private final CouponService couponService;
    private final UserRepository userRepository;

    // Lấy danh sách tất cả coupon (thường dùng cho Admin)
    @GetMapping
    public ResponseEntity<List<Coupon>> getAll() {
        return ResponseEntity.ok(couponService.getAllCoupons());
    }

    // Kiểm tra thông tin một mã giảm giá cụ thể
    @GetMapping("/{code}")
    public ResponseEntity<Coupon> getByCode(@PathVariable String code) {
        return ResponseEntity.ok(couponService.getCouponByCode(code));
    }

    @PostMapping
    public ResponseEntity<?> createCoupon(@RequestBody Coupon coupon, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Your session has expired. Please log in again!");
        }

        // 1. Lấy thông tin Admin đang thực hiện từ username trong Token
        User admin = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("Administrator not found!"));

        // 2. Truyền admin.getId() vào Service
        try {
            Coupon saved = couponService.createCoupon(coupon, admin.getId());
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCoupon(
            @PathVariable Integer id,
            @RequestBody Coupon coupon,
            @RequestParam Integer adminId // Nhận trực tiếp adminId từ URL
    ) {
        try {
            // Gọi service xử lý
            Coupon updated = couponService.updateCoupon(id, coupon, adminId);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }

}
