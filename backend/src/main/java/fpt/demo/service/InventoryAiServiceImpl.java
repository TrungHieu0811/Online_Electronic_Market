package fpt.demo.service;

import fpt.demo.dto.InventoryAlertDto;
import fpt.demo.dto.InventoryDashboardDto;
import fpt.demo.dto.InventoryForecastDto;
import fpt.demo.dto.ProductReviewSentimentSummaryDto;
import fpt.demo.dto.ReorderSuggestionDto;
import fpt.demo.dto.SlowMovingDto;
import fpt.demo.dto.ai.ReviewSummaryRequest;
import fpt.demo.dto.ai.ReviewSummaryResponse;
import fpt.demo.entity.Product;
import fpt.demo.repository.OrderItemRepository;
import fpt.demo.repository.ProductRepository;
import fpt.demo.service.AiReviewService;
import fpt.demo.service.InventoryAiService;
import fpt.demo.service.ProductReviewService;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class InventoryAiServiceImpl implements InventoryAiService {

    private final ProductRepository productRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductReviewService productReviewService;
    private final AiReviewService aiReviewService;

    @Override
    public InventoryForecastDto forecastProduct(Integer productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        LocalDateTime now = LocalDateTime.now();

        Integer sold7Days = orderItemRepository.getTotalSoldByProductSince(
                productId, now.minusDays(7)
        );
        Integer sold30Days = orderItemRepository.getTotalSoldByProductSince(
                productId, now.minusDays(30)
        );

        double avg7 = sold7Days / 7.0;
        double avg30 = sold30Days / 30.0;

        double predictedDaily = (avg7 * 0.6) + (avg30 * 0.4);

        if (product.getViewCount() != null && product.getViewCount() > 100) {
            predictedDaily += 0.5;
        }

        if (product.getAverageRating() != null && product.getAverageRating() >= 4.5) {
            predictedDaily += 0.5;
        }

        int predicted7 = (int) Math.ceil(predictedDaily * 7);
        int predicted30 = (int) Math.ceil(predictedDaily * 30);

        int currentStock = product.getStockQuantity() != null ? product.getStockQuantity() : 0;

        int daysUntilOutOfStock;
        if (predictedDaily <= 0) {
            daysUntilOutOfStock = 999;
        } else {
            daysUntilOutOfStock = (int) Math.floor(currentStock / predictedDaily);
        }

        String stockStatus;
        if (daysUntilOutOfStock <= 3) {
            stockStatus = "CRITICAL";
        } else if (daysUntilOutOfStock <= 7) {
            stockStatus = "WARNING";
        } else {
            stockStatus = "NORMAL";
        }

        return new InventoryForecastDto(
                product.getId(),
                product.getVariantName(),
                currentStock,
                avg7,
                avg30,
                predicted7,
                predicted30,
                daysUntilOutOfStock,
                stockStatus
        );
    }

    @Override
    public List<ReorderSuggestionDto> getReorderSuggestions() {
        List<Product> products = productRepository.findAll();
        List<ReorderSuggestionDto> result = new ArrayList<>();

        for (Product product : products) {
            InventoryForecastDto forecast = forecastProduct(product.getId());

            int safetyStock = Math.max(5, forecast.getPredictedDemand7Days());
            int recommendedStock = forecast.getPredictedDemand30Days() + safetyStock;
            int reorderQuantity = recommendedStock - forecast.getCurrentStock();

            if (reorderQuantity > 0) {
                String priority;

                if ("CRITICAL".equals(forecast.getStockStatus())) {
                    priority = "HIGH";
                } else if ("WARNING".equals(forecast.getStockStatus())) {
                    priority = "MEDIUM";
                } else {
                    priority = "LOW";
                }

                result.add(new ReorderSuggestionDto(
                        product.getId(),
                        product.getVariantName(),
                        forecast.getCurrentStock(),
                        forecast.getPredictedDemand30Days(),
                        recommendedStock,
                        reorderQuantity,
                        priority
                ));
            }
        }

        return result;
    }

    @Override
    public List<InventoryAlertDto> getStockAlerts() {
        List<Product> products = productRepository.findAll();
        List<InventoryAlertDto> result = new ArrayList<>();

        for (Product product : products) {
            InventoryForecastDto forecast = forecastProduct(product.getId());

            if ("CRITICAL".equals(forecast.getStockStatus())
                    || "WARNING".equals(forecast.getStockStatus())) {

                int predictedDaily = (int) Math.ceil(
                        forecast.getPredictedDemand7Days() / 7.0
                );

                result.add(new InventoryAlertDto(
                        product.getId(),
                        product.getVariantName(),
                        forecast.getCurrentStock(),
                        predictedDaily,
                        forecast.getDaysUntilOutOfStock(),
                        forecast.getStockStatus()
                ));
            }
        }

        return result;
    }

    @Override
    public List<SlowMovingDto> getSlowMovingProducts() {
        List<Product> products = productRepository.findAll();
        List<SlowMovingDto> result = new ArrayList<>();

        LocalDateTime now = LocalDateTime.now();

        for (Product product : products) {
            Integer sold30 = orderItemRepository.getTotalSoldByProductSince(
                    product.getId(),
                    now.minusDays(30)
            );

            int stock = product.getStockQuantity() != null ? product.getStockQuantity() : 0;

            // rule AI đơn giản
            if (stock > 20 && sold30 < 5) {
                result.add(new SlowMovingDto(
                        product.getId(),
                        product.getVariantName(),
                        stock,
                        sold30,
                        "High stock but low sales in last 30 days"
                ));
            }
        }

        return result;
    }

    @Override
    public InventoryDashboardDto getDashboard(Integer productId) {
        InventoryForecastDto forecast = forecastProduct(productId);

        ProductReviewSentimentSummaryDto sentimentSummary
                = productReviewService.getSentimentSummary(productId);

        ReorderSuggestionDto reorderSuggestion = null;
        List<ReorderSuggestionDto> suggestions = getReorderSuggestions();

        for (ReorderSuggestionDto item : suggestions) {
            if (item.getProductId().equals(productId)) {
                reorderSuggestion = item;
                break;
            }
        }

        List<String> approvedComments = productReviewService.getApprovedReviewComments(productId);

        ReviewSummaryResponse reviewSummary;

        if (approvedComments.isEmpty()) {
            reviewSummary = new ReviewSummaryResponse(
                    List.of("No approved reviews yet."),
                    false
            );
        } else {
            try {
                ReviewSummaryRequest request = new ReviewSummaryRequest();
                request.setProductId(productId);
                request.setReviews(approvedComments);

                reviewSummary = aiReviewService.summarizeReviews(request);
            } catch (Exception e) {
                reviewSummary = new ReviewSummaryResponse(
                        List.of(
                                "AI summary is temporarily unavailable.",
                                "Please try again later.",
                                "Forecast, reorder, and sentiment data are still available."
                        ),
                        false
                );
            }
        }

        return new InventoryDashboardDto(
                forecast,
                reorderSuggestion,
                sentimentSummary,
                reviewSummary
        );
    }
}
