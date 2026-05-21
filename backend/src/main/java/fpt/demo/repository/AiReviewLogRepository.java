package fpt.demo.repository;

import fpt.demo.entity.AiReviewLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface AiReviewLogRepository extends JpaRepository<AiReviewLog, Integer> {

    long countByFeatureType(AiReviewLog.FeatureType featureType);

    long countByFeatureTypeAndStatus(AiReviewLog.FeatureType featureType, AiReviewLog.LogStatus status);

    long countByCacheHitTrue();

    Optional<AiReviewLog> findTopByFeatureTypeAndCacheKeyAndStatusAndExpiresAtAfterOrderByCreatedAtDesc(
            AiReviewLog.FeatureType featureType,
            String cacheKey,
            AiReviewLog.LogStatus status,
            LocalDateTime now
    );

    List<AiReviewLog> findTop20ByOrderByCreatedAtDesc();
}