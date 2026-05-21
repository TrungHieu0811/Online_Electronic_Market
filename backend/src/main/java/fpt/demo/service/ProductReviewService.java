package fpt.demo.service;

import java.util.List;

import org.springframework.data.domain.Page;

import fpt.demo.dto.CreateReviewDto;
import fpt.demo.dto.ProductReviewSentimentSummaryDto;
import fpt.demo.dto.ReviewResponseDto;
import fpt.demo.dto.ReviewSummaryDto;
import fpt.demo.entity.ProductReview;

public interface ProductReviewService {

    ProductReview create(CreateReviewDto dto);

    List<ReviewResponseDto> getByProduct(Integer productId);

    ProductReview update(Integer reviewId, CreateReviewDto dto);

    ReviewResponseDto mapToDto(ProductReview review);

    void approveReview(Integer reviewId);

    void rejectReview(Integer reviewId);

    Page<ReviewResponseDto> getAdminReviews(int page, int size, String status);

    Object getAdminReviewStats();

    ReviewSummaryDto getReviewSummary(Integer productId);

    ProductReviewSentimentSummaryDto getSentimentSummary(Integer productId);

    List<String> getApprovedReviewComments(Integer productId);
}
