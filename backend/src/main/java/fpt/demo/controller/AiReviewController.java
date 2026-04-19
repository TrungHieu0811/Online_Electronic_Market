package fpt.demo.controller;

import fpt.demo.dto.ai.*;
import fpt.demo.service.AiReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai/reviews")
@RequiredArgsConstructor
public class AiReviewController {

    private final AiReviewService aiReviewService;

    @PostMapping("/sentiment")
    public ResponseEntity<ReviewSentimentResponse> analyzeSentiment(
            @Valid @RequestBody ReviewSentimentRequest request
    ) {
        return ResponseEntity.ok(aiReviewService.analyzeSentiment(request));
    }

    @PostMapping("/suggest")
    public ResponseEntity<SuggestReviewResponse> suggestReviewComments(
            @Valid @RequestBody SuggestReviewRequest request
    ) {
        return ResponseEntity.ok(aiReviewService.suggestReviewComments(request));
    }

    @PostMapping("/summary")
    public ResponseEntity<ReviewSummaryResponse> summarizeReviews(
            @Valid @RequestBody ReviewSummaryRequest request
    ) {
        return ResponseEntity.ok(aiReviewService.summarizeReviews(request));
    }

    @GetMapping("/stats")
    public ResponseEntity<AiUsageStatsResponse> getUsageStats() {
        return ResponseEntity.ok(aiReviewService.getUsageStats());
    }
}