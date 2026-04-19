package fpt.demo.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "ai_review_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiReviewLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "feature_type", nullable = false, length = 30)
    @Enumerated(EnumType.STRING)
    private FeatureType featureType;
    // SENTIMENT, SUGGEST, SUMMARY

    @Column(name = "target_type", length = 30)
    @Enumerated(EnumType.STRING)
    private TargetType targetType;
    // REVIEW, PRODUCT, COMMENT

    @Column(name = "target_id")
    private Integer targetId;
    // vd: productId hoặc reviewId

    @Column(name = "product_id")
    private Integer productId;

    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "input_text", columnDefinition = "NVARCHAR(MAX)")
    private String inputText;

    @Column(name = "output_text", columnDefinition = "NVARCHAR(MAX)")
    private String outputText;

    @Column(name = "status", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private LogStatus status;
    // SUCCESS, FAILED

    @Column(name = "cache_key", length = 255)
    private String cacheKey;

    @Column(name = "cache_hit")
    private Boolean cacheHit;

    @Column(name = "model_name", length = 100)
    private String modelName;

    @Column(name = "error_message", columnDefinition = "NVARCHAR(MAX)")
    private String errorMessage;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    public enum FeatureType {
        SENTIMENT,
        SUGGEST,
        SUMMARY
    }

    public enum TargetType {
        REVIEW,
        PRODUCT,
        COMMENT
    }

    public enum LogStatus {
        SUCCESS,
        FAILED
    }

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (cacheHit == null) {
            cacheHit = false;
        }
    }
}