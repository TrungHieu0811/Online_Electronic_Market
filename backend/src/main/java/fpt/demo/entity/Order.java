/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package fpt.demo.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Data;


/**
 *
 * @author ngo42
 */
@Entity
@Data
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

//    @JsonIgnore
    @JsonIgnoreProperties({"orders", "password", "otpCode", "avatarUrl", "rewardPoints"})
    @ManyToOne
    private User user;

    @ManyToOne
    private Coupon coupon;

    private String shippingName;
    private String shippingPhone;
    @Column(name = "shipping_address", columnDefinition = "NVARCHAR(MAX)")
    private String shippingAddress;
    private String shippingNote;
    @Column(name = "shipping_fee")
    private Double shippingFee = 0.0;

    private Double totalImportPrice;
    private Double totalBasePrice;

    private Double taxAmount;
    private Double discountAmount;

    private Double totalPayPrice;

    public enum PaymentMethod {
        COD,
        VNPAY,
        PAYPAL,
        MOMO
    }
    @Enumerated(EnumType.STRING)
    private PaymentMethod paymentMethod;
    private String paymentStatus = "PENDING";

    public enum OrderStatus {
        PENDING(null), // Chờ xử lý, chưa có action từ admin
        CONFIRMED(OrderManagement.ActionType.CONFIRMED),
        SHIPPING(OrderManagement.ActionType.SHIPPING),
        DELIVERED(OrderManagement.ActionType.DELIVERED),
        CANCELLED(OrderManagement.ActionType.CANCELLED);

        private final OrderManagement.ActionType relatedAction;

        OrderStatus(OrderManagement.ActionType action) {
            this.relatedAction = action;
        }

        public OrderManagement.ActionType getRelatedAction() {
            return relatedAction;
        }
    }
    @Enumerated(EnumType.STRING)
    private OrderStatus orderStatus = OrderStatus.PENDING;
    private String verifyStatus = "UNVERIFIED";

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer totalQuantity = 0;
    
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<OrderItem> orderItems;
}
