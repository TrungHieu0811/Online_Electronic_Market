package fpt.demo.service;

import fpt.demo.entity.Coupon;
import fpt.demo.entity.CouponUsage;
import fpt.demo.entity.User;
import fpt.demo.repository.CouponUsageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class CouponUsageServiceImpl implements CouponUsageService {

    private final CouponUsageRepository couponUsageRepository;

    @Override
    @Transactional
    public void recordUsage(User user, Coupon coupon, Integer orderId) {
        CouponUsage usage = new CouponUsage();
        usage.setUser(user);
        usage.setCoupon(coupon);
        usage.setOrderId(orderId);
        usage.setAppliedAt(LocalDateTime.now());

        couponUsageRepository.save(usage);
    }

    @Override
    public boolean hasReachedUserLimit(Integer userId, Coupon coupon) {
        long usedCount = couponUsageRepository.countByUserIdAndCouponId(userId, coupon.getId());
        // perUserLimit được định nghĩa trong entity Coupon (mặc định là 1)
        return usedCount >= coupon.getPerUserLimit();
    }
}