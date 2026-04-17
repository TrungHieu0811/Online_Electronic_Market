package fpt.demo.service;

import fpt.demo.repository.CouponRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class CouponTaskService {

    private final CouponRepository couponRepository;

    /**
     * Tự động quét và vô hiệu hóa coupon hết hạn mỗi 10 phút.
     * cron: "0 0/10 * * * *" (Giây Phút Giờ Ngày Tháng Thứ)
     */
    @Scheduled(cron = "0 0/1 * * * *") // Chạy mỗi 10 phút
    public void autoUpdateCouponStatus() {
        LocalDateTime now = LocalDateTime.now();
        
        // 1. Chuyển SCHEDULED -> ACTIVE
        int activated = couponRepository.activateScheduledCoupons(now);
        if (activated > 0) log.info("Đã kích hoạt {} coupon đến giờ chạy.", activated);
        
        // 2. Chuyển ACTIVE -> EXPIRED
        int expired = couponRepository.deactivateExpiredCoupons(now);
        if (expired > 0) log.info("Đã vô hiệu hóa {} coupon hết hạn.", expired);
    }
}