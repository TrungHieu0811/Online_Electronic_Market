package fpt.demo.service;

import fpt.demo.entity.CouponManagement;
import java.util.List;

public interface CouponManagementService {

  void logAction(Integer adminId, Integer couponId, String actionType, String details, String reason);

  List<CouponManagement> getHistoryByCoupon(Integer couponId);

  List<CouponManagement> getAllHistory();
}
