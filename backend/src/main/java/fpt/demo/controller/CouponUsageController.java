package fpt.demo.controller;

import fpt.demo.entity.CouponUsage;
import fpt.demo.entity.User;
import fpt.demo.repository.UserRepository;
import fpt.demo.repository.CouponUsageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/admin/coupons-history")
@RequiredArgsConstructor
public class CouponUsageController {

    private final CouponUsageRepository couponUsageRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<CouponUsage>> getMyCouponHistory(Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();

        User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<CouponUsage> history = couponUsageRepository.findByUserId(user.getId());
        return ResponseEntity.ok(history);
    }
}