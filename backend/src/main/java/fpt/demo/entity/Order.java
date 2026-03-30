/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package fpt.demo.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

/**
 *
 * @author ngo42
 */
@Entity
@Table(name = "orders")
@Getter
@Setter
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    private User user;

    @ManyToOne
    private Coupon coupon;

    private String shippingName;
    private String shippingPhone;
    private String shippingAddress;
    private String shippingNote;

    private Double totalImportPrice;
    private Double totalBasePrice;

    private Double taxAmount;
    private Double discountAmount;

    private Double totalPayPrice;

    private String paymentMethod;
    private String paymentStatus = "PENDING";

    private String orderStatus = "PENDING";
    private String verifyStatus = "UNVERIFIED";

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
