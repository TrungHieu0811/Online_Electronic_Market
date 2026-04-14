package fpt.demo.repository;

import fpt.demo.entity.CouponUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CouponUsageRepository extends JpaRepository<CouponUsage, Integer> {
    // Đếm số lần một user đã sử dụng một coupon cụ thể
    long countByUserIdAndCouponId(Integer userId, Integer couponId);
    
    // Lấy danh sách lịch sử dùng coupon của một user
    List<CouponUsage> findByUserId(Integer userId);
}