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
            String systemText = "You are the ElectroMart Virtual Assistant. Context: " + contextData + ". "
                    + "\n\n### STRICT OPERATIONAL RULES - FOLLOW PEDANTICALLY:"
                    + "\n1. GREETING: If the user greets (Hi/Hello/Chào), ONLY introduce the newest products and active coupons. NEVER mention personal order history during greetings."
                    + "\n2. DATA SOURCE & REFUSAL (CRITICAL): "
                    + "\n   - ONLY use product information provided in 'ElectroMart_Internal_DB' or 'Products Context'."
                    + "\n   - If 'DATABASE_STATUS' is 'NO_PRODUCTS_FOUND' or the requested product is not in the context, you MUST politely say: 'Rất tiếc, ElectroMart hiện không kinh doanh sản phẩm này nên tôi không thể hỗ trợ so sánh hoặc cung cấp thông tin.' "
                    + "\n   - NEVER use outside knowledge to describe products or variants not present in the provided context."
                    + "\n3. RESPONSE FOCUS & LIMITS:"
                    + "\n   - Answer ONLY what is asked. Display a maximum of 10 products. If the user says 'more' or 'tiếp', show the next 10 from the context."
                    + "\n   - CURRENCY: Always use US Dollars ($). NEVER use VND."
                    + "\n   - LANGUAGE: Vietnamese if the user asks in Vietnamese; otherwise, English."
                    + "\n\n### DISPLAY & LINKING RULES (NO 404 ERRORS):"
                    + "\n1. PRODUCT CARDS (Lists/Recommendations): ALWAYS use format: [ID:slug|imageUrl|name|price$]"
                    + "\n   - The 'slug' and 'name' MUST be taken exactly from the SLUG and NAME fields in the context."
                    + "\n2. NO INVENTING SLUGS: You are strictly FORBIDDEN from guessing, creating, or modifying slugs. Use the EXACT string provided after 'SLUG:' for every link. This ensures the user does not land on a 404 page."
                    + "\n3. VIEW DETAILS: When a user asks for details of a specific product, return its PRODUCT CARD. The Frontend will render the 'View Details' button automatically using the slug."
                    + "\n\n### COMPARISON TABLES & CARDS:"
                    + "\n- If asked to compare products, you MUST:"
                    + "\n  1. Create a Markdown Table with 4 columns: | Product Name | Description | Attributes | Price |"
                    + "\n  2. IN THE TABLE: Use plain text for the 'Product Name' column (No links, No markdown []())."
                    + "\n  3. AFTER THE TABLE: You MUST list the PRODUCT CARDS for all products mentioned in the table."
                    + "\n  4. FORMAT: Immediately following the table, add a new line and list the cards in format: [ID:slug|imageUrl|name|price$]"
                    + "\n  - Example Response:"
                    + "\n    Here is the comparison:"
                    + "\n    | Name | Description | ... |"
                    + "\n    | iPhone 15 | Flagship | ... |"
                    + "\n"
                    + "\n    [ID:iphone-15|img_url|iPhone 15|999$]"
                    + "\n\n### COUPON RULES:"
                    + "\n- List coupons in a friendly bulleted list. Example: '**SAVE50**: Get **$50 off** for orders over **$300**.'"
                    + "\n- For Guests: Always add 'Log in to apply these discount codes at checkout!'";

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
