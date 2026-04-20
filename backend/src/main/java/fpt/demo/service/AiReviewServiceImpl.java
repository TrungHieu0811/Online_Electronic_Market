package fpt.demo.service;

import com.google.genai.Client;
import com.google.genai.types.GenerateContentResponse;
import fpt.demo.dto.ai.*;
import fpt.demo.entity.AiReviewLog;
import fpt.demo.repository.AiReviewLogRepository;
import fpt.demo.service.AiReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AiReviewServiceImpl implements AiReviewService {

    private final Client geminiClient;
    private final AiReviewLogRepository aiReviewLogRepository;
    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.model}")
    private String model;

    @Value("${app.ai.summary-cache-hours:24}")
    private int summaryCacheHours;

    @Override
    public ReviewSentimentResponse analyzeSentiment(ReviewSentimentRequest request) {

        String prompt = """
            You are an AI for e-commerce review analysis.

            Consider BOTH the rating and the review content.

            Rules:
            - If rating is 4 or 5 → sentiment should be POSITIVE unless content is clearly negative
            - If rating is 1 or 2 → sentiment should be NEGATIVE
            - If rating is 3 → sentiment is NEUTRAL

            Return ONLY in this exact format:
            SENTIMENT: <POSITIVE or NEUTRAL or NEGATIVE>
            EXPLANATION: <short explanation>

            Rating: """ + request.getRating() + """
            Review:
            """ + request.getContent();

        try {
            String output = callGemini(prompt);

            String sentiment = extractValue(output, "SENTIMENT:");
            String explanation = extractValue(output, "EXPLANATION:");

            ReviewSentimentResponse response = new ReviewSentimentResponse(
                    sentiment != null ? sentiment : "NEUTRAL",
                    explanation != null ? explanation : "No explanation"
            );

            saveLog(
                    AiReviewLog.FeatureType.SENTIMENT,
                    AiReviewLog.TargetType.REVIEW,
                    null,
                    request.getProductId(),
                    request.getUserId(),
                    request.getContent(),
                    output,
                    AiReviewLog.LogStatus.SUCCESS,
                    null,
                    false,
                    null,
                    null
            );

            return response;

        } catch (Exception e) {
            saveLog(
                    AiReviewLog.FeatureType.SENTIMENT,
                    AiReviewLog.TargetType.REVIEW,
                    null,
                    request.getProductId(),
                    request.getUserId(),
                    request.getContent(),
                    null,
                    AiReviewLog.LogStatus.FAILED,
                    null,
                    false,
                    null,
                    e.getMessage()
            );

            throw new RuntimeException("Failed to analyze sentiment: " + e.getMessage());
        }
    }

    @Override
    public SuggestReviewResponse suggestReviewComments(SuggestReviewRequest request) {
        String prompt = """
                You are an AI assistant for e-commerce review writing.
                Based on the rating, product, and category, generate exactly 5 short review suggestions.
                Each suggestion must be:
                - natural English
                - short
                - useful for a product review
                Return ONLY 5 lines, each line starts with "- "

                Rating: """ + request.getRating() + """
                Product: """ + nullToEmpty(request.getProductName()) + """
                Category: """ + nullToEmpty(request.getCategoryName());

        try {
            String output = callGemini(prompt);

            List<String> suggestions = Arrays.stream(output.split("\\r?\\n"))
                    .map(String::trim)
                    .filter(line -> !line.isBlank())
                    .map(line -> line.startsWith("-") ? line.substring(1).trim() : line)
                    .filter(line -> !line.isBlank())
                    .limit(5)
                    .toList();

            SuggestReviewResponse response = new SuggestReviewResponse(suggestions);

            saveLog(
                    AiReviewLog.FeatureType.SUGGEST,
                    AiReviewLog.TargetType.PRODUCT,
                    request.getProductId(),
                    request.getProductId(),
                    request.getUserId(),
                    "rating=" + request.getRating() + ", product=" + request.getProductName(),
                    output,
                    AiReviewLog.LogStatus.SUCCESS,
                    null,
                    false,
                    null,
                    null
            );

            return response;
        } catch (Exception e) {
            saveLog(
                    AiReviewLog.FeatureType.SUGGEST,
                    AiReviewLog.TargetType.PRODUCT,
                    request.getProductId(),
                    request.getProductId(),
                    request.getUserId(),
                    "rating=" + request.getRating() + ", product=" + request.getProductName(),
                    null,
                    AiReviewLog.LogStatus.FAILED,
                    null,
                    false,
                    null,
                    e.getMessage()
            );
            throw new RuntimeException("Failed to suggest review comments: " + e.getMessage());
        }
    }

    @Override
    public ReviewSummaryResponse summarizeReviews(ReviewSummaryRequest request) {
        String cacheKey = "summary_product_" + request.getProductId();

        var cached = aiReviewLogRepository
                .findTopByFeatureTypeAndCacheKeyAndStatusAndExpiresAtAfterOrderByCreatedAtDesc(
                        AiReviewLog.FeatureType.SUMMARY,
                        cacheKey,
                        AiReviewLog.LogStatus.SUCCESS,
                        LocalDateTime.now()
                );

        if (cached.isPresent()) {
            AiReviewLog log = cached.get();

            saveLog(
                    AiReviewLog.FeatureType.SUMMARY,
                    AiReviewLog.TargetType.PRODUCT,
                    request.getProductId(),
                    request.getProductId(),
                    null,
                    "CACHE_REUSE",
                    log.getOutputText(),
                    AiReviewLog.LogStatus.SUCCESS,
                    cacheKey,
                    true,
                    log.getExpiresAt(),
                    null
            );

            List<String> bullets = Arrays.stream(log.getOutputText().split("\\r?\\n"))
                    .map(String::trim)
                    .filter(line -> !line.isBlank())
                    .map(line -> line.startsWith("-") ? line.substring(1).trim() : line)
                    .toList();

            return new ReviewSummaryResponse(bullets, true);
        }

        String joinedReviews = String.join("\n", request.getReviews());

        String prompt = """
                You are an AI assistant for e-commerce review summarization.
                Summarize the customer reviews into exactly 3 bullet points.
                Each bullet must:
                - be short
                - be clear
                - describe common feedback
                Return ONLY 3 lines, each line starts with "- "

                Reviews:
                """ + joinedReviews;

        try {
            String output = callGemini(prompt);

            LocalDateTime expiresAt = LocalDateTime.now().plusHours(summaryCacheHours);

            saveLog(
                    AiReviewLog.FeatureType.SUMMARY,
                    AiReviewLog.TargetType.PRODUCT,
                    request.getProductId(),
                    request.getProductId(),
                    null,
                    joinedReviews,
                    output,
                    AiReviewLog.LogStatus.SUCCESS,
                    cacheKey,
                    false,
                    expiresAt,
                    null
            );

            List<String> bullets = Arrays.stream(output.split("\\r?\\n"))
                    .map(String::trim)
                    .filter(line -> !line.isBlank())
                    .map(line -> line.startsWith("-") ? line.substring(1).trim() : line)
                    .limit(3)
                    .toList();

            return new ReviewSummaryResponse(bullets, false);
        } catch (Exception e) {
            saveLog(
                    AiReviewLog.FeatureType.SUMMARY,
                    AiReviewLog.TargetType.PRODUCT,
                    request.getProductId(),
                    request.getProductId(),
                    null,
                    joinedReviews,
                    null,
                    AiReviewLog.LogStatus.FAILED,
                    cacheKey,
                    false,
                    null,
                    e.getMessage()
            );
            throw new RuntimeException("Failed to summarize reviews: " + e.getMessage());
        }
    }

    @Override
    public AiUsageStatsResponse getUsageStats() {
        long sentimentTotal = aiReviewLogRepository.countByFeatureType(AiReviewLog.FeatureType.SENTIMENT);
        long suggestTotal = aiReviewLogRepository.countByFeatureType(AiReviewLog.FeatureType.SUGGEST);
        long summaryTotal = aiReviewLogRepository.countByFeatureType(AiReviewLog.FeatureType.SUMMARY);

        long successTotal
                = aiReviewLogRepository.countByFeatureTypeAndStatus(AiReviewLog.FeatureType.SENTIMENT, AiReviewLog.LogStatus.SUCCESS)
                + aiReviewLogRepository.countByFeatureTypeAndStatus(AiReviewLog.FeatureType.SUGGEST, AiReviewLog.LogStatus.SUCCESS)
                + aiReviewLogRepository.countByFeatureTypeAndStatus(AiReviewLog.FeatureType.SUMMARY, AiReviewLog.LogStatus.SUCCESS);

        long failedTotal
                = aiReviewLogRepository.countByFeatureTypeAndStatus(AiReviewLog.FeatureType.SENTIMENT, AiReviewLog.LogStatus.FAILED)
                + aiReviewLogRepository.countByFeatureTypeAndStatus(AiReviewLog.FeatureType.SUGGEST, AiReviewLog.LogStatus.FAILED)
                + aiReviewLogRepository.countByFeatureTypeAndStatus(AiReviewLog.FeatureType.SUMMARY, AiReviewLog.LogStatus.FAILED);

        long summaryCacheHits = aiReviewLogRepository.countByCacheHitTrue();

        return new AiUsageStatsResponse(
                sentimentTotal,
                suggestTotal,
                summaryTotal,
                summaryCacheHits,
                successTotal,
                failedTotal
        );
    }

    private String callGemini(String prompt) {
        try {
            var sslContext = org.apache.hc.core5.ssl.SSLContextBuilder.create()
                    .loadTrustMaterial(org.apache.hc.client5.http.ssl.TrustAllStrategy.INSTANCE)
                    .build();

            var socketFactory = org.apache.hc.client5.http.ssl.SSLConnectionSocketFactoryBuilder.create()
                    .setSslContext(sslContext)
                    .setHostnameVerifier(org.apache.hc.client5.http.ssl.NoopHostnameVerifier.INSTANCE)
                    .build();

            var connectionManager = org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManagerBuilder.create()
                    .setSSLSocketFactory(socketFactory)
                    .build();

            var httpClient = org.apache.hc.client5.http.impl.classic.HttpClients.custom()
                    .setConnectionManager(connectionManager)
                    .build();

            var restTemplate = new org.springframework.web.client.RestTemplate(
                    new org.springframework.http.client.HttpComponentsClientHttpRequestFactory(httpClient)
            );

            // ✅ FIX CHÍNH NẰM Ở ĐÂY
            String url = "https://generativelanguage.googleapis.com/v1beta/models/"
                    + model + ":generateContent?key=" + apiKey;

            Map<String, Object> body = Map.of(
                    "contents", List.of(
                            Map.of("parts", List.of(Map.of("text", prompt)))
                    )
            );

            var headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);

            var entity = new org.springframework.http.HttpEntity<>(body, headers);

            var response = restTemplate.postForEntity(url, entity, Map.class);

            List<?> candidates = (List<?>) response.getBody().get("candidates");

            if (candidates != null && !candidates.isEmpty()) {
                Map<?, ?> content = (Map<?, ?>) ((Map<?, ?>) candidates.get(0)).get("content");
                List<?> parts = (List<?>) content.get("parts");

                return ((Map<?, ?>) parts.get(0)).get("text").toString();
            }

            throw new RuntimeException("No response from Gemini");

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Gemini call failed: " + e.getMessage());
        }
    }

    private void saveLog(
            AiReviewLog.FeatureType featureType,
            AiReviewLog.TargetType targetType,
            Integer targetId,
            Integer productId,
            Integer userId,
            String inputText,
            String outputText,
            AiReviewLog.LogStatus status,
            String cacheKey,
            Boolean cacheHit,
            LocalDateTime expiresAt,
            String errorMessage
    ) {
        AiReviewLog log = AiReviewLog.builder()
                .featureType(featureType)
                .targetType(targetType)
                .targetId(targetId)
                .productId(productId)
                .userId(userId)
                .inputText(inputText)
                .outputText(outputText)
                .status(status)
                .cacheKey(cacheKey)
                .cacheHit(cacheHit)
                .modelName(model)
                .expiresAt(expiresAt)
                .errorMessage(errorMessage)
                .build();

        aiReviewLogRepository.save(log);
    }

    private String extractValue(String text, String prefix) {
        return Arrays.stream(text.split("\\r?\\n"))
                .map(String::trim)
                .filter(line -> line.startsWith(prefix))
                .map(line -> line.substring(prefix.length()).trim())
                .findFirst()
                .orElse(null);
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }
}
