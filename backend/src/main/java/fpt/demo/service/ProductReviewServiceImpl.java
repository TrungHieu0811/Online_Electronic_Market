package fpt.demo.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import fpt.demo.dto.CreateReviewDto;
import fpt.demo.dto.ReviewResponseDto;
import fpt.demo.dto.ReviewStatsDto;
import fpt.demo.dto.ReviewSummaryDto;
import fpt.demo.dto.UserSimpleDto;
import fpt.demo.dto.ai.ReviewSentimentRequest;
import fpt.demo.dto.ai.ReviewSentimentResponse;
import fpt.demo.entity.Order;
import fpt.demo.entity.Product;
import fpt.demo.entity.ProductGroup;
import fpt.demo.entity.ProductReview;
import fpt.demo.entity.User;
import fpt.demo.repository.OrderRepository;
import fpt.demo.repository.ProductGroupRepository;
import fpt.demo.repository.ProductRepository;
import fpt.demo.repository.ProductReviewRepository;
import fpt.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProductReviewServiceImpl implements ProductReviewService {

    private final ProductReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final ProductGroupRepository groupRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final AiReviewService aiReviewService;

    // =========================
    // CREATE REVIEW
    // =========================
    @Override
    public ProductReview create(CreateReviewDto dto) {

        // check product
        Product product = productRepository.findById(dto.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found"));

        // check user
        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // check order
        Order order = orderRepository.findById(dto.getOrderId())
                .orElseThrow(() -> new RuntimeException("Order not found"));

        // check đã review chưa
        if (reviewRepository.existsByUserIdAndProductId(dto.getUserId(), dto.getProductId())) {
            throw new RuntimeException("Bạn đã review sản phẩm này rồi");
        }

        ProductReview review = new ProductReview();

        review.setProduct(product);
        review.setUser(user);
        review.setOrder(order);

        // group (optional)
        if (dto.getGroupId() != null) {
            ProductGroup group = groupRepository.findById(dto.getGroupId()).orElse(null);
            review.setGroup(group);
        }

        review.setRatingScore(dto.getRatingScore());
        review.setComment(dto.getComment());
        review.setImageUrl(dto.getImageUrl());

        if (dto.getComment() != null && !dto.getComment().isBlank()) {
            ReviewSentimentRequest aiRequest = new ReviewSentimentRequest();
            aiRequest.setContent(dto.getComment());
            aiRequest.setRating(dto.getRatingScore());
            aiRequest.setProductId(dto.getProductId());
            aiRequest.setUserId(dto.getUserId());

            ReviewSentimentResponse aiResult = aiReviewService.analyzeSentiment(aiRequest);

            review.setSentiment(aiResult.getSentiment());
            review.setSentimentExplanation(aiResult.getExplanation());
        }

        review.setCreatedAt(LocalDateTime.now());
        review.setStatus(ProductReview.ReviewStatus.PENDING);

        ProductReview saved = reviewRepository.save(review);

        // update average rating
        Double avg = reviewRepository.getAverageRating(product.getId());
        product.setAverageRating(avg != null ? avg : 0);
        productRepository.save(product);

        return saved;
    }

    @Override
    public ProductReview update(Integer reviewId, CreateReviewDto dto) {

        ProductReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        // check user (chỉ chủ review được sửa)
        if (!review.getUser().getId().equals(dto.getUserId())) {
            throw new RuntimeException("Bạn không có quyền sửa review này");
        }

        // check thời gian (7 ngày)
        if (review.getCreatedAt().isBefore(LocalDateTime.now().minusDays(7))) {
            throw new RuntimeException("Đã quá thời gian chỉnh sửa review");
        }

        // update fields
        review.setRatingScore(dto.getRatingScore());
        review.setComment(dto.getComment());
        review.setImageUrl(dto.getImageUrl());

        if (dto.getComment() != null && !dto.getComment().isBlank()) {
            ReviewSentimentRequest aiRequest = new ReviewSentimentRequest();
            aiRequest.setContent(dto.getComment());
            aiRequest.setRating(dto.getRatingScore());
            aiRequest.setProductId(review.getProduct().getId());
            aiRequest.setUserId(dto.getUserId());

            ReviewSentimentResponse aiResult = aiReviewService.analyzeSentiment(aiRequest);

            review.setSentiment(aiResult.getSentiment());
            review.setSentimentExplanation(aiResult.getExplanation());
        } else {
            review.setSentiment(null);
            review.setSentimentExplanation(null);
        }

        // có thể set lại status để admin duyệt lại
        review.setStatus(ProductReview.ReviewStatus.PENDING);

        ProductReview updated = reviewRepository.save(review);

        // update lại average rating
        Double avg = reviewRepository.getAverageRating(review.getProduct().getId());
        Product product = review.getProduct();
        product.setAverageRating(avg != null ? avg : 0);
        productRepository.save(product);

        return updated;
    }

    // =========================
    // GET REVIEWS BY PRODUCT
    // =========================
    @Override
    public List<ReviewResponseDto> getByProduct(Integer productId) {

        return reviewRepository
                .findByProductIdAndStatus(productId, ProductReview.ReviewStatus.APPROVED)
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    @Override
    public void approveReview(Integer reviewId) {

        ProductReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        // set APPROVED
        review.setStatus(ProductReview.ReviewStatus.APPROVED);

        reviewRepository.save(review);

        // update average rating
        Product product = review.getProduct();

        Double avg = reviewRepository.getAverageRating(product.getId());

        product.setAverageRating(avg != null ? avg : 0);

        productRepository.save(product);
    }

    @Override
    public void rejectReview(Integer reviewId) {

        ProductReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        // set REJECTED
        review.setStatus(ProductReview.ReviewStatus.REJECTED);

        reviewRepository.save(review);

        // update lại average rating
        Product product = review.getProduct();

        Double avg = reviewRepository.getAverageRating(product.getId());

        product.setAverageRating(avg != null ? avg : 0);

        productRepository.save(product);
    }

    @Override
    public Page<ReviewResponseDto> getAdminReviews(int page, int size, String status) {
        Pageable pageable = PageRequest.of(page, size);

        Page<ProductReview> reviewPage;

        if (status == null || status.isBlank() || status.equalsIgnoreCase("ALL")) {
            reviewPage = reviewRepository.findAllByOrderByCreatedAtDesc(pageable);
        } else {
            ProductReview.ReviewStatus reviewStatus = ProductReview.ReviewStatus.valueOf(status.toUpperCase());
            reviewPage = reviewRepository.findByStatusOrderByCreatedAtDesc(reviewStatus, pageable);
        }

        return reviewPage.map(this::mapToDto);
    }

    @Override
    public ReviewStatsDto getAdminReviewStats() {
        ReviewStatsDto dto = new ReviewStatsDto();

        dto.setTotalReviews(reviewRepository.count());
        dto.setPendingCount(reviewRepository.countByStatus(ProductReview.ReviewStatus.PENDING));
        dto.setRejectedCount(reviewRepository.countByStatus(ProductReview.ReviewStatus.REJECTED));

        LocalDateTime startOfDay = LocalDateTime.now().toLocalDate().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);

        dto.setApprovedToday(
                reviewRepository.countByStatusAndCreatedAtBetween(
                        ProductReview.ReviewStatus.APPROVED,
                        startOfDay,
                        endOfDay));

        return dto;
    }

    // =========================
    // MAPPER
    // =========================
    public ReviewResponseDto mapToDto(ProductReview review) {

        ReviewResponseDto dto = new ReviewResponseDto();

        dto.setId(review.getId());
        dto.setProductId(review.getProduct() != null ? review.getProduct().getId() : null);
        dto.setProductName(
                review.getProduct() != null ? review.getProduct().getVariantName() : "Unknown product");
        dto.setProductThumbnail(null);

        dto.setRatingScore(review.getRatingScore());
        dto.setComment(review.getComment());
        dto.setImageUrl(review.getImageUrl());
        dto.setStatus(review.getStatus().name());
        dto.setCreatedAt(review.getCreatedAt());
        dto.setSentiment(review.getSentiment());
        dto.setSentimentExplanation(review.getSentimentExplanation());

        UserSimpleDto userDto = new UserSimpleDto();
        if (review.getUser() != null) {
            userDto.setId(review.getUser().getId());
            userDto.setUsername(review.getUser().getUsername());
        } else {
            userDto.setId(null);
            userDto.setUsername("Unknown user");
        }

        dto.setUser(userDto);

        return dto;
    }

    @Override
    public ReviewSummaryDto getReviewSummary(Integer productId) {
        ProductReview.ReviewStatus approved = ProductReview.ReviewStatus.APPROVED;

        Long totalReviews = reviewRepository.countByProductIdAndStatus(productId, approved);

        Long fiveStar = reviewRepository.countByProductIdAndRatingScoreAndStatus(productId, 5, approved);
        Long fourStar = reviewRepository.countByProductIdAndRatingScoreAndStatus(productId, 4, approved);
        Long threeStar = reviewRepository.countByProductIdAndRatingScoreAndStatus(productId, 3, approved);
        Long twoStar = reviewRepository.countByProductIdAndRatingScoreAndStatus(productId, 2, approved);
        Long oneStar = reviewRepository.countByProductIdAndRatingScoreAndStatus(productId, 1, approved);

        Double avg = reviewRepository.getAverageRating(productId);
        if (avg == null) {
            avg = 0.0;
        }

        ReviewSummaryDto dto = new ReviewSummaryDto();
        dto.setAverageRating(avg);
        dto.setTotalReviews(totalReviews);

        if (totalReviews == 0) {
            dto.setFiveStarPercent(0);
            dto.setFourStarPercent(0);
            dto.setThreeStarPercent(0);
            dto.setTwoStarPercent(0);
            dto.setOneStarPercent(0);
        } else {
            dto.setFiveStarPercent((int) Math.round(fiveStar * 100.0 / totalReviews));
            dto.setFourStarPercent((int) Math.round(fourStar * 100.0 / totalReviews));
            dto.setThreeStarPercent((int) Math.round(threeStar * 100.0 / totalReviews));
            dto.setTwoStarPercent((int) Math.round(twoStar * 100.0 / totalReviews));
            dto.setOneStarPercent((int) Math.round(oneStar * 100.0 / totalReviews));
        }

        return dto;
    }
}