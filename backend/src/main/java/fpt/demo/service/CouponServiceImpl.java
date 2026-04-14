package fpt.demo.service;

import fpt.demo.entity.Coupon;
import fpt.demo.repository.CouponRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CouponServiceImpl implements CouponService {

    private final CouponRepository couponRepository;
    private final CouponManagementService couponManagementService;
    private final CouponUsageService couponUsageService;

    @Override
    public List<Coupon> getAllCoupons() {
        return couponRepository.findAll();
    }

    @Override
    public Coupon getCouponByCode(String code) {
        return couponRepository.findByCode(code)
                .orElseThrow(() -> new IllegalArgumentException("Coupon code does not exist!"));
    }

    @Override
    @Transactional
    public Coupon createCoupon(Coupon coupon, Integer adminId) {
        // 1. Kiểm tra trùng mã
        if (couponRepository.existsByCode(coupon.getCode())) {
            throw new IllegalArgumentException("Coupon code already exists!");
        }

        LocalDateTime now = LocalDateTime.now();

        // 2. VALIDATE THỜI GIAN
        // Ngày bắt đầu không được ở quá khứ (cho phép sai số 1 phút do độ trễ hệ thống)
        if (coupon.getStartDate() != null && coupon.getStartDate().isBefore(now.minusMinutes(1))) {
            throw new IllegalArgumentException("Start date must be from current time or in the future!");
        }

        // Ngày kết thúc phải sau ngày bắt đầu
        if (coupon.getStartDate() != null && coupon.getEndDate() != null) {
            if (!coupon.getEndDate().isAfter(coupon.getStartDate())) {
                throw new IllegalArgumentException("End date must be after start date!");
            }
        }

        // 3. VALIDATE LOGIC GIÁ TRỊ (FIXED_AMOUNT)
        // Validate logic giá trị theo loại giảm giá
        if ("PERCENTAGE".equals(coupon.getDiscountType())) {
            if (coupon.getDiscountValue() == null || coupon.getDiscountValue() <= 0) {
                throw new IllegalArgumentException("Percentage discount must be greater than 0!");
            }
            if (coupon.getDiscountValue() > 100) {
                // CHẶN LỖI Ở BACKEND
                throw new IllegalArgumentException("Percentage discount cannot exceed 100%!");
            }
        } else if ("FIXED_AMOUNT".equals(coupon.getDiscountType())) {
            if (coupon.getMinOrderValue() != null && coupon.getDiscountValue() != null) {
                if (coupon.getMinOrderValue() <= coupon.getDiscountValue()) {
                    throw new IllegalArgumentException("Minimum order value must be greater than the discount amount!");
                }
            }
        }

        // 4. QUYẾT ĐỊNH TRẠNG THÁI BAN ĐẦU
        if (coupon.getStartDate() != null && now.isBefore(coupon.getStartDate())) {
            coupon.setStatus(Coupon.CouponStatus.SCHEDULED);
        } else {
            coupon.setStatus(Coupon.CouponStatus.ACTIVE);
        }

        // 5. THIẾT LẬP THÔNG TIN CƠ BẢN
        coupon.setCreatedAt(now);
        if (coupon.getUsedCount() == null) {
            coupon.setUsedCount(0);
        }

        // Lưu Coupon
        Coupon saved = couponRepository.save(coupon);

        // 6. GHI LOG HÀNH ĐỘNG
        couponManagementService.logAction(
                adminId,
                saved.getId(),
                "CREATE",
                "Created new coupon with status: " + saved.getStatus(),
                "Initial system promotion"
        );

        return saved;
    }

    @Override
    public boolean isValid(String code, Double orderValue) {
        Coupon coupon = couponRepository.findByCode(code)
                .orElseThrow(() -> new IllegalArgumentException("Coupon not found!"));

        LocalDateTime now = LocalDateTime.now();

        // 1. Kiểm tra trạng thái Enum
        if (coupon.getStatus() != Coupon.CouponStatus.ACTIVE) {
            return false;
        }

        // 2. Kiểm tra thời gian hiệu lực
        if (coupon.getStartDate() != null && now.isBefore(coupon.getStartDate())) {
            return false;
        }
        if (coupon.getEndDate() != null && now.isAfter(coupon.getEndDate())) {
            // Tự động cập nhật trạng thái nếu phát hiện hết hạn khi check
            return false;
        }

        // 3. Kiểm tra lượt dùng (Hỗ trợ trường hợp Unlimited - usageLimit là null)
        if (coupon.getUsageLimit() != null) {
            if (coupon.getUsedCount() >= coupon.getUsageLimit()) {
                return false;
            }
        }

        // 4. Kiểm tra giá trị đơn hàng tối thiểu
        if (coupon.getMinOrderValue() != null && orderValue < coupon.getMinOrderValue()) {
            return false;
        }

        return true;
    }

    @Override
    @Transactional
    public Coupon updateCoupon(Integer id, Coupon updateData, Integer adminId) {
        Coupon existing = couponRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Coupon not found!"));

        Coupon.CouponStatus currentStatus = existing.getStatus();
        LocalDateTime now = LocalDateTime.now();

        // 1. CHẶN NẾU ĐÃ HẾT HẠN
        if (currentStatus == Coupon.CouponStatus.EXPIRED) {
            throw new IllegalArgumentException("Expired coupons are read-only.");
        }

        // 2. LOGIC THAY ĐỔI TRẠNG THÁI (DISABLE / RE-ENABLE)
        // Ưu tiên xử lý đổi trạng thái trước để không bị vướng validate content
        if (updateData.getStatus() != null && updateData.getStatus() != currentStatus) {

            // CHO PHÉP DISABLE: Từ ACTIVE hoặc SCHEDULED sang DISABLED
            if ((currentStatus == Coupon.CouponStatus.ACTIVE || currentStatus == Coupon.CouponStatus.SCHEDULED)
                    && updateData.getStatus() == Coupon.CouponStatus.DISABLED) {
                existing.setStatus(Coupon.CouponStatus.DISABLED);
            } // CHO PHÉP RE-ENABLE: Từ DISABLED quay lại
            else if (currentStatus == Coupon.CouponStatus.DISABLED
                    && (updateData.getStatus() == Coupon.CouponStatus.SCHEDULED || updateData.getStatus() == Coupon.CouponStatus.ACTIVE)) {

                if (existing.getEndDate() != null && existing.getEndDate().isBefore(now)) {
                    throw new IllegalArgumentException("Cannot re-enable an expired coupon.");
                }

                existing.setStatus(existing.getStartDate().isAfter(now)
                        ? Coupon.CouponStatus.SCHEDULED : Coupon.CouponStatus.ACTIVE);
            }
        } // 3. LOGIC SỬA NỘI DUNG (Chỉ khi đang SCHEDULED)
        else if (currentStatus == Coupon.CouponStatus.SCHEDULED) {
            // Validate Start Date: Chỉ check nếu Admin thay đổi ngày mới
            if (updateData.getStartDate() != null && !updateData.getStartDate().equals(existing.getStartDate())) {
                if (updateData.getStartDate().isBefore(now.minusMinutes(1))) {
                    throw new IllegalArgumentException("New start date cannot be in the past!");
                }
                existing.setStartDate(updateData.getStartDate());
            }

            // Validate End Date
            if (updateData.getEndDate() != null) {
                LocalDateTime finalStart = updateData.getStartDate() != null ? updateData.getStartDate() : existing.getStartDate();
                if (!updateData.getEndDate().isAfter(finalStart)) {
                    throw new IllegalArgumentException("End date must be after start date!");
                }
                existing.setEndDate(updateData.getEndDate());
            }

            existing.setUsageLimit(updateData.getUsageLimit());
            existing.setPerUserLimit(updateData.getPerUserLimit());
            existing.setDescription(updateData.getDescription());

            // Tự động tính lại status sau khi sửa content
            existing.setStatus(existing.getStartDate().isAfter(now)
                    ? Coupon.CouponStatus.SCHEDULED : Coupon.CouponStatus.ACTIVE);
        } else {
            throw new IllegalArgumentException("Modification not allowed in current status. You can only Disable it.");
        }

        // LƯU VÀ GHI LOG
        Coupon saved = couponRepository.save(existing);
        couponManagementService.logAction(adminId, saved.getId(), "UPDATE",
                "Updated status to: " + saved.getStatus(), "Admin modification");

        return saved;
    }

    public List<Coupon> getAvailableCouponsForUser(Double orderValue, Integer userId) {
        // 1. Lấy tất cả coupon đang ACTIVE
        List<Coupon> activeCoupons = couponRepository.findByStatus(Coupon.CouponStatus.ACTIVE);

        return activeCoupons.stream()
                .filter(c -> c.getMinOrderValue() == null || orderValue >= c.getMinOrderValue()) // Đủ điều kiện đơn hàng
                .filter(c -> {
                    // Check tổng lượt dùng hệ thống
                    if (c.getUsageLimit() != null && c.getUsedCount() >= c.getUsageLimit()) {
                        return false;
                    }
                    // Check lượt dùng của User này (Dùng CouponUsageService đã có)
                    return !couponUsageService.hasReachedUserLimit(userId, c);
                })
                .sorted((c1, c2) -> {
                    // Sắp xếp: Ưu tiên giảm nhiều tiền nhất lên đầu
                    Double discount1 = calculateDiscountValue(c1, orderValue);
                    Double discount2 = calculateDiscountValue(c2, orderValue);
                    return discount2.compareTo(discount1); // Giảm dần
                })
                .collect(Collectors.toList());
    }

// Hàm bổ trợ tính số tiền giảm thực tế
    private Double calculateDiscountValue(Coupon c, Double subtotal) {
        if ("PERCENTAGE".equals(c.getDiscountType())) {
            double val = (subtotal * c.getDiscountValue()) / 100;
            return (c.getMaxDiscountAmount() != null && val > c.getMaxDiscountAmount()) ? c.getMaxDiscountAmount() : val;
        }
        return c.getDiscountValue();
    }

    
    @Transactional
    public void rollbackCouponUsage(String code) {
        Coupon coupon = couponRepository.findByCode(code)
                .orElseThrow(() -> new IllegalArgumentException("Coupon not found"));

        if (coupon.getUsedCount() > 0) {
            coupon.setUsedCount(coupon.getUsedCount() - 1);
            couponRepository.save(coupon);
        }
    }

    @Override
    @Transactional
    public void deleteCoupon(Integer id) {
        // Nên kiểm tra sự tồn tại trước khi xóa
        if (!couponRepository.existsById(id)) {
            throw new IllegalArgumentException("Cannot delete: Coupon ID " + id + " not found!");
        }
        couponRepository.deleteById(id);
    }
}
