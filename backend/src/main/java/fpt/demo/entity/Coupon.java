  /*
     * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
     * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package fpt.demo.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

/**
 *
 * @author ngo42
 */
@Entity
@Table(name = "coupons")
@Getter
@Setter
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String code;
    private String description;

    private String discountType;
    private Double discountValue;
    private Double maxDiscountAmount;

    private Double minOrderValue = 0.0;

    private Integer usageLimit;
    private Integer usedCount = 0;

    private Integer perUserLimit = 1;

    private LocalDateTime startDate;
    private LocalDateTime endDate;

    public enum CouponStatus {
        ACTIVE, // Đang có hiệu lực
        SCHEDULED, // Chờ đến ngày bắt đầu (Tạo trước)
        EXPIRED, // Đã hết hạn theo thời gian
        FULLY_REDEEMED, // Đã hết lượt sử dụng (usageLimit)
        DISABLED         // Bị Admin vô hiệu hóa thủ công
    }

    @Enumerated(EnumType.STRING)
    private CouponStatus status;

    private LocalDateTime createdAt;
}
