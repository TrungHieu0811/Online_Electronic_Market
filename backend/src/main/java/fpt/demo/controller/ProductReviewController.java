package fpt.demo.controller;

import fpt.demo.dto.CreateReviewDto;
import fpt.demo.dto.ReviewResponseDto;
import fpt.demo.dto.ReviewSummaryDto;
import fpt.demo.entity.ProductReview;
import fpt.demo.service.ProductReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ProductReviewController {

    private final ProductReviewService service;

    // =========================
    // CREATE REVIEW
    // =========================
    @PostMapping
    public ResponseEntity<ReviewResponseDto> create(@Valid @RequestBody CreateReviewDto dto) {
        ProductReview review = service.create(dto);
        return ResponseEntity.ok(service.mapToDto(review)); // 🔥 dùng DTO
    }

    // =========================
    // UPDATE REVIEW
    // =========================
    @PutMapping("/{id}")
    public ResponseEntity<ReviewResponseDto> update(
            @PathVariable Integer id,
            @Valid @RequestBody CreateReviewDto dto
    ) {
        ProductReview review = service.update(id, dto);
        return ResponseEntity.ok(service.mapToDto(review)); // 🔥 dùng DTO
    }

    // =========================
    // GET REVIEWS BY PRODUCT
    // =========================
    @GetMapping("/product/{productId}")
    public ResponseEntity<List<ReviewResponseDto>> getByProduct(@PathVariable Integer productId) {
        return ResponseEntity.ok(service.getByProduct(productId));
    }

    @GetMapping("/product/{productId}/summary")
    public ResponseEntity<ReviewSummaryDto> getReviewSummary(@PathVariable Integer productId) {
        return ResponseEntity.ok(service.getReviewSummary(productId));
    }
}
