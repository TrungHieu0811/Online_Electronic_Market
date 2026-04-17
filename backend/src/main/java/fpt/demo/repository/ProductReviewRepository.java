package fpt.demo.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import fpt.demo.entity.ProductReview;

public interface ProductReviewRepository extends JpaRepository<ProductReview, Integer> {

    List<ProductReview> findByProductId(Integer productId);

    boolean existsByUserIdAndProductId(Integer userId, Integer productId);

    List<ProductReview> findByProductIdAndStatus(Integer productId, ProductReview.ReviewStatus status);

    @Query("SELECT AVG(r.ratingScore) FROM ProductReview r WHERE r.product.id = :productId AND r.status = 'APPROVED'")
    Double getAverageRating(Integer productId);

    boolean existsByOrderItemId(Integer orderItemId);

    Page<ProductReview> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<ProductReview> findByStatusOrderByCreatedAtDesc(ProductReview.ReviewStatus status, Pageable pageable);

    long countByStatus(ProductReview.ReviewStatus status);

    long countByStatusAndCreatedAtBetween(
            ProductReview.ReviewStatus status,
            LocalDateTime start,
            LocalDateTime end);

    Page<ProductReview> findByCommentContainingIgnoreCaseOrderByCreatedAtDesc(String keyword, Pageable pageable);
}
