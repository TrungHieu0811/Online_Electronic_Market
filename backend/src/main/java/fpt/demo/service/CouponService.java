package fpt.demo.service;

import fpt.demo.entity.Coupon;
import java.util.List;

public interface CouponService {
    List<Coupon> getAllCoupons();
    Coupon getCouponByCode(String code);
    Coupon createCoupon(Coupon coupon, Integer adminId);
    void deleteCoupon(Integer id);
    Coupon updateCoupon(Integer id, Coupon coupon, Integer adminId);
    // Logic kiểm tra coupon có hợp lệ cho đơn hàng không
    boolean isValid(String code, Double orderValue);
    List<Coupon> getAvailableCouponsForUser(Double orderValue, Integer userId);
    void rollbackCouponUsage(String code);
}