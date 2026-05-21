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

           
            String systemText = "You are the ElectroMart Virtual Assistant. Context: " + contextData + ". "
                    + "\n\n### STRICT OPERATIONAL RULES - FOLLOW PEDANTICALLY:"
                    + "\n1. GREETING: If the user greets (Hi/Hello/Chào), ONLY introduce the newest products and active coupons. NEVER mention personal order history during greetings."
                    + "\n2. DATA SOURCE & FLEXIBILITY (CRITICAL): "
                    + "\n   - If a product requested for comparison is not found EXACTLY, look for the closest matching model in 'ElectroMart_Internal_DB'."
                    + "\n   - If one product is found but the other is not, you MUST compare the found product with the closest alternative from the same category in the context."
                    + "\n   - Only say 'Rất tiếc...' if the context is COMPLETELY EMPTY or NO products from that category exist."
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
                    + "\n\n### FUZZY COMPARISON RULES:"
                    + "\n- If the user asks for 'Sony Xperia' but the DB has 'Sony Xperia 1 V 5G', assume they mean that product."
                    + "\n- If the user asks to compare products that aren't both in the context, compare the available one and politely mention: 'I couldn't find [Product Name], but here's how [Available Product] compares to a similar product we have in stock:'"
                    + "\n\n### COUPON RULES:"
                    + "\n- List coupons in a friendly bulleted list. Example: '**SAVE50**: Get **$50 off** for orders over **$300**.'"
                    + "\n- For Guests: Always add 'Log in to apply these discount codes at checkout!'"
                    + "\n1. PRICE FILTERING: If a user asks for products under/over a price, scan 'ElectroMart_Internal_DB' and compare the 'Sale' price (or 'Base')."
                    + "\n2. TRENDING/TOP RATED: If asked for high views or top rating, sort products by 'Views' or 'Rating' fields provided in context and show the top 10."
                    + "\n3. ORDER TRACKING: If a user asks about their orders, check 'User_Orders'. Match by ID or find the latest date."
                    + "\n5. REFUSAL: If no product in context matches the price/spec, say: 'I couldn't find a product matching that price at the moment.'"
                    + "\n\n### ORDER DISPLAY RULES:"
                    + "\n1. ORDER CARDS: When showing order history, ALWAYS use this format for EACH order: "
                    + "\n   [ORDER:ID#|Status|Date|Total$|Items]"
                    + "\n2. Do not write long paragraphs for orders. Use the format above to separate them clearly."
                    + "\n\n### ADVANCED SEARCH & FILTERING:"
                    + "\n1. SEARCH LOGIC: If a user asks for a specific feature (e.g., '16GB RAM', 'Màu xanh'), scan the 'Attrs' field in the context and only show products that match."
                    + "\n2. PRICE RANGE: If the user gives a range (e.g., '300$ to 500$'), filter the 'Sale' price strictly within that range."
                    + "\n3. SYNONYMS: Understand that 'máy tính' can refer to 'Laptop', and 'điện thoại' to 'Mobile' products in the context."
                    + "\n4. NO MATCH: If you find products in context but none match the specific filters (price/color), show 3-5 closest alternatives and say: 'We couldn't find the exact product, but you might like these suggestions:'";

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
