package fpt.demo.controller;

import fpt.demo.dto.CreateOrderReviewsDto;
import fpt.demo.service.OrderReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderReviewController {

    private final OrderReviewService orderReviewService;

    @GetMapping("/{orderId}/review")
    public ResponseEntity<?> getOrderForReview(@PathVariable Integer orderId) {
        return ResponseEntity.ok(orderReviewService.getOrderForReview(orderId));
    }

    @PostMapping("/{orderId}/reviews")
    public ResponseEntity<?> submitOrderReviews(
            @PathVariable Integer orderId,
            @RequestBody CreateOrderReviewsDto dto
    ) {
        return ResponseEntity.ok(orderReviewService.submitOrderReviews(orderId, dto));
    }
}