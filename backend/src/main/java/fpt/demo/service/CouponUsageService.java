package fpt.demo.service;

import fpt.demo.entity.Coupon;
import fpt.demo.entity.User;

public interface CouponUsageService {
    // Ghi nhận lượt dùng coupon sau khi đặt hàng thành công
    void recordUsage(User user, Coupon coupon, Integer orderId);
    
    // Kiểm tra xem User còn lượt dùng cho Coupon này không
    boolean hasReachedUserLimit(Integer userId, Coupon coupon);
}