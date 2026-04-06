/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package fpt.demo.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 *
 * @author ngo42
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(unique = true, nullable = false)
    private String email;

    private String password;

    private String fullName;
    @Column(unique = true)
    private String phone;
    private String address;

    private Integer gender;

    private LocalDate dob;

    private String avatarUrl;

    @Builder.Default
    private Integer rewardPoints = 0;
    @Builder.Default
    private Double ratingScore = 5.0;

    @Builder.Default
    private Integer failedDeliveryCount = 0;

    @Enumerated(EnumType.STRING) // Ép Spring Boot phải lưu dưới dạng chuỗi chữ
    @Builder.Default
    private Role userRole = Role.ROLE_USER;

    @Builder.Default
    private Boolean status = true;

    @Builder.Default
    private String authProvider = "local";
    private String providerId;

    @Builder.Default
    private Boolean emailConfirmed = false;

    private String otpCode;
    private LocalDateTime otpExpiration;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
