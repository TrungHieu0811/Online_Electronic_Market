package fpt.demo.controller;

import fpt.demo.dto.InventoryAlertDto;
import fpt.demo.dto.InventoryDashboardDto;
import fpt.demo.dto.InventoryForecastDto;
import fpt.demo.dto.ProductReviewSentimentSummaryDto;
import fpt.demo.dto.ReorderSuggestionDto;
import fpt.demo.dto.SlowMovingDto;
import fpt.demo.service.InventoryAiService;
import fpt.demo.service.ProductReviewService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/inventory-ai")
@RequiredArgsConstructor
public class InventoryAiController {

    private final InventoryAiService inventoryAiService;
    private final ProductReviewService reviewService;

    @GetMapping("/review-sentiment/{productId}")
    public ResponseEntity<ProductReviewSentimentSummaryDto> getSentiment(
            @PathVariable Integer productId) {

        return ResponseEntity.ok(
                reviewService.getSentimentSummary(productId)
        );
    }

    @GetMapping("/forecast/{productId}")
    public ResponseEntity<InventoryForecastDto> forecastProduct(
            @PathVariable Integer productId
    ) {
        return ResponseEntity.ok(inventoryAiService.forecastProduct(productId));
    }

    @GetMapping("/reorder-suggestions")
    public ResponseEntity<List<ReorderSuggestionDto>> getReorderSuggestions() {
        return ResponseEntity.ok(inventoryAiService.getReorderSuggestions());
    }

    @GetMapping("/stock-alerts")
    public ResponseEntity<List<InventoryAlertDto>> getStockAlerts() {
        return ResponseEntity.ok(inventoryAiService.getStockAlerts());
    }

    @GetMapping("/slow-moving")
    public ResponseEntity<List<SlowMovingDto>> getSlowMovingProducts() {
        return ResponseEntity.ok(inventoryAiService.getSlowMovingProducts());
    }

    @GetMapping("/dashboard/{productId}")
    public ResponseEntity<InventoryDashboardDto> getDashboard(
            @PathVariable Integer productId
    ) {
        return ResponseEntity.ok(inventoryAiService.getDashboard(productId));
    }
}
