package fpt.demo.dto;

import fpt.demo.dto.ai.ReviewSummaryResponse;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class InventoryDashboardDto {
    private InventoryForecastDto forecast;
    private ReorderSuggestionDto reorderSuggestion;
    private ProductReviewSentimentSummaryDto sentimentSummary;
    private ReviewSummaryResponse reviewSummary;
}