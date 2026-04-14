package fpt.demo.controller;

import fpt.demo.dto.ReviewResponseDto;
import fpt.demo.service.ProductReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/reviews")
@RequiredArgsConstructor
public class AdminReviewController {

    private final ProductReviewService service;

    @GetMapping
    public ResponseEntity<Page<ReviewResponseDto>> getAdminReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "ALL") String status
    ) {
        return ResponseEntity.ok(service.getAdminReviews(page, size, status));
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        return ResponseEntity.ok(service.getAdminReviewStats());
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approve(@PathVariable Integer id) {
        service.approveReview(id);
        return ResponseEntity.ok("Approved successfully");
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<?> reject(@PathVariable Integer id) {
        service.rejectReview(id);
        return ResponseEntity.ok("Rejected successfully");
    }
}