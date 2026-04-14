/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package fpt.demo.controller;

import fpt.demo.entity.Coupon;
import fpt.demo.entity.User;
import fpt.demo.repository.UserRepository;
import fpt.demo.service.CouponService;
import java.security.Principal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 *
 * @author hmn27
 */
@RestController
@RequestMapping("/api/users/coupons")
@RequiredArgsConstructor
public class CouponUserController {

    private final CouponService couponService;
    private final UserRepository userRepository;

    // API hỗ trợ Client kiểm tra nhanh xem mã có áp dụng được không
    @GetMapping("/validate")
    public ResponseEntity<Boolean> validateCoupon(@RequestParam String code, @RequestParam Double orderValue) {
        return ResponseEntity.ok(couponService.isValid(code, orderValue));
    }

    // Thêm vào CouponUserController.java
    @GetMapping("/available")
    public ResponseEntity<List<Coupon>> getAvailable(@RequestParam Double orderValue, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }

        // Tìm User dựa trên username trong Token
        User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Gọi hàm Service chúng ta vừa viết ở bước trước
        List<Coupon> available = couponService.getAvailableCouponsForUser(orderValue, user.getId());
        return ResponseEntity.ok(available);
    }

    @PostMapping("/rollback")
    public ResponseEntity<?> rollback(@RequestParam String code) {
        try {
            couponService.rollbackCouponUsage(code);
            return ResponseEntity.ok("Coupon rolled back successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        couponService.deleteCoupon(id);
        return ResponseEntity.noContent().build();
    }
}
