package fpt.demo.service;

import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManagerBuilder;
import org.apache.hc.client5.http.ssl.SSLConnectionSocketFactoryBuilder;
import org.apache.hc.client5.http.ssl.TrustAllStrategy;
import org.apache.hc.core5.ssl.SSLContextBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class GeminiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    private static final String MODEL_NAME = "gemini-3-flash-preview";

    public String getChatResponse(String userPrompt, String contextData) {
        try {
            var sslContext = SSLContextBuilder.create().loadTrustMaterial(TrustAllStrategy.INSTANCE).build();
            var socketFactory = SSLConnectionSocketFactoryBuilder.create().setSslContext(sslContext).build();
            var connectionManager = PoolingHttpClientConnectionManagerBuilder.create().setSSLSocketFactory(socketFactory).build();
            CloseableHttpClient httpClient = HttpClients.custom().setConnectionManager(connectionManager).build();
            RestTemplate restTemplate = new RestTemplate(new HttpComponentsClientHttpRequestFactory(httpClient));

            String url = "https://generativelanguage.googleapis.com/v1beta/models/" + MODEL_NAME + ":generateContent?key=" + apiKey;

            // 1. Cập nhật System Instruction để đáp ứng các yêu cầu nghiệp vụ mới
            // Trong GeminiService.java
            String systemText = "You are the ElectroMart Virtual Assistant. "
                    + "Context: " + contextData + ". "
                    + "\n\nSTRICT RULES - FOLLOW PEDANTICALLY:"
                    + "\n1. GREETING: If the user greets (Hi/Hello/Chào), ONLY introduce the newest products and active coupons. NEVER mention order status here."
                    + "\n2. RESPONSE FOCUS: Answer ONLY what is asked. If the user asks for a product, show products. If they ask for order status, show status. Do not volunteer extra info."
                    + "\n3. PRODUCT LIMIT: Display maximum 10 products. If the user says 'more' or 'tiếp', show the next 10 from context."
                    + "\n4. CURRENCY: Always use $ (USD). NEVER use VND."
                    + "\n5. CARDS: Use [ID:slug|imageUrl|name|price$] for product recommendations."
                    + "\n6. LANGUAGE: Vietnamese if asked in Vietnamese, otherwise English."
                    + "\n7- For product lists (Newest/Search results): ALWAYS use the CARD format: [ID:slug|imageUrl|name|price]"
                    + "\n8- ONLY use Markdown links [Name](/products/slug) inside Table cells or long descriptions."
                    + "\n9. COMPARISON TABLES (CRITICAL):"
                    + "\n   - Create a Markdown Table with exactly 4 columns: | Product Name | Description | Attributes | Price |"
                    + "\n   - The 'Product Name' column MUST be a Markdown link."
                    + "\n   - Format: [Display Name](/products/slug)"
                    + "\n   - Example: If context has 'iphone-15|iPhone 15', you write: [iPhone 15](/products/iphone-15)"
                    + "\n   - DO NOT display the slug or the pipe (|) character directly in the table cell."
                    + "\n\nSTRICT RULES FOR COUPONS:"
                    + "\n1. When mentioning coupons, use a friendly bulleted list."
                    + "\n2. For fixed discounts, say: 'Get $[amount] off for orders over $[min_value]'."
                    + "\n3. Do not use technical terms like 'Fixed Amount' or 'Discount Type'."
                    + "\n4. If the user is a Guest, remind them: 'Sign in to apply these coupons at checkout!'"
                    + "\n5. Format Example:"
                    + "\n   - **SAVE50**: Get **$50 off** for orders over **$300**."
                    + "\n   - **WELCOME10**: Get **10% off** for your total order.";

            Map<String, Object> systemInstruction = Map.of(
                    "parts", List.of(Map.of("text", systemText))
            );

            // 2. Prepare User Message
            Map<String, Object> userContent = Map.of(
                    "role", "user",
                    "parts", List.of(Map.of("text", userPrompt))
            );

            // 3. Request Body
            Map<String, Object> requestBody = Map.of(
                    "system_instruction", systemInstruction,
                    "contents", List.of(userContent)
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            // 4. Execute and Extract
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            List<?> candidates = (List<?>) response.getBody().get("candidates");
            if (candidates != null && !candidates.isEmpty()) {
                Map<?, ?> content = (Map<?, ?>) ((Map<?, ?>) candidates.get(0)).get("content");
                List<?> parts = (List<?>) content.get("parts");
                return ((Map<?, ?>) parts.get(0)).get("text").toString();
            }

            return "I am sorry, I couldn't process your request.";

        } catch (Exception e) {
            e.printStackTrace();
            return "System Error: Unable to contact AI Assistant.";
        }
    }
}
