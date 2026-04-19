package fpt.demo.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

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
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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

    @Column(name = "full_name", columnDefinition = "NVARCHAR(MAX)")
    private String fullName;

    @Column(unique = true)
    private String phone;

    @Column(columnDefinition = "nvarchar(500)")
    private String address;

    private Integer gender;

    private LocalDate dob;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Builder.Default
    @Column(name = "reward_points")
    private Integer rewardPoints = 0;

    @Builder.Default
    @Column(name = "rating_score")
    private Double ratingScore = 5.0;

    @Builder.Default
    @Column(name = "failed_delivery_count")
    private Integer failedDeliveryCount = 0;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "user_role")
    private Role userRole = Role.ROLE_USER;

    @Builder.Default
    private Boolean status = true;

    @Builder.Default
    @Column(name = "auth_provider")
    private String authProvider = "local";

    @Column(name = "provider_id")
    private String providerId;

    @Builder.Default
    @Column(name = "email_confirmed")
    private Boolean emailConfirmed = false;

    @Column(name = "otp_code")
    private String otpCode;

    @Column(name = "otp_expiration")
    private LocalDateTime otpExpiration;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}