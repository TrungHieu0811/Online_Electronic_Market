package fpt.demo.repository;

import fpt.demo.entity.CouponManagement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CouponManagementRepository extends JpaRepository<CouponManagement, Integer> {
    // Lấy lịch sử tác động lên một Coupon cụ thể
    List<CouponManagement> findByCouponId(Integer couponId);
    
    // Lấy lịch sử các hành động của một Admin cụ thể
    List<CouponManagement> findByAdminId(Integer adminId);
}