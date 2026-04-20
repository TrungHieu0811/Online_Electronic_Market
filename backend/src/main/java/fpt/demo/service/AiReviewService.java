package fpt.demo.service;

import fpt.demo.dto.ai.*;

public interface AiReviewService {

    ReviewSentimentResponse analyzeSentiment(ReviewSentimentRequest request);

    SuggestReviewResponse suggestReviewComments(SuggestReviewRequest request);

    ReviewSummaryResponse summarizeReviews(ReviewSummaryRequest request);

    AiUsageStatsResponse getUsageStats();
}