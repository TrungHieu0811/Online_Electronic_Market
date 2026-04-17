package fpt.demo.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import fpt.demo.entity.Coupon;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, Integer> {

    // Tìm coupon theo mã để kiểm tra khi áp dụng mã giảm giá
    Optional<Coupon> findByCode(String code);

    // Kiểm tra mã đã tồn tại chưa (dùng khi tạo mới)
    boolean existsByCode(String code);

    @Modifying
    @Transactional
    @Query("UPDATE Coupon c SET c.usedCount = c.usedCount + 1 WHERE c.id = :couponId")
    void incrementUsedCount(@Param("couponId") Integer couponId);

    @Modifying
    @Transactional
    @Query("UPDATE Coupon c SET c.status = fpt.demo.entity.Coupon.CouponStatus.ACTIVE "
            + "WHERE c.status = fpt.demo.entity.Coupon.CouponStatus.SCHEDULED AND c.startDate <= :now")
    int activateScheduledCoupons(@Param("now") LocalDateTime now);

    @Modifying
    @Transactional
    @Query("UPDATE Coupon c SET c.status = fpt.demo.entity.Coupon.CouponStatus.EXPIRED "
            + "WHERE c.status = fpt.demo.entity.Coupon.CouponStatus.ACTIVE AND c.endDate < :now")
    int deactivateExpiredCoupons(@Param("now") LocalDateTime now);
    
    List<Coupon> findByStatus(Coupon.CouponStatus status);

}
