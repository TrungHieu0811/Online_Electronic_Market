package fpt.demo.service;

import fpt.demo.entity.Coupon;
import fpt.demo.entity.CouponManagement;
import fpt.demo.entity.User;
import fpt.demo.repository.CouponManagementRepository;
import fpt.demo.repository.CouponRepository;
import fpt.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CouponManagementServiceImpl implements CouponManagementService {

    private final CouponManagementRepository managementRepository;
    private final UserRepository userRepository;
    private final CouponRepository couponRepository;

    @Override
    public void logAction(Integer adminId, Integer couponId, String actionType, String details, String reason) {
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy Admin!"));
        
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy Coupon!"));

        CouponManagement log = new CouponManagement();
        log.setAdmin(admin);
        log.setCoupon(coupon);
        log.setActionType(actionType);
        log.setDetails(details);
        log.setReason(reason);
        log.setCreatedAt(LocalDateTime.now());

        managementRepository.save(log);
    }

    @Override
    public List<CouponManagement> getHistoryByCoupon(Integer couponId) {
        return managementRepository.findByCouponId(couponId);
    }

    @Override
    public List<CouponManagement> getAllHistory() {
        return managementRepository.findAll();
    }
}