package fpt.demo.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class PayPalService {

    @Value("${paypal.client-id}")
    private String clientId;

    @Value("${paypal.client-secret}")
    private String clientSecret;

    @Value("${paypal.base-url}")
    private String baseUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    // 1. Lấy Access Token từ PayPal (OAuth2)
    public String getAccessToken() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        // Sử dụng setBasicAuth giúp Spring tự động tạo chuỗi Base64 đúng chuẩn
        headers.setBasicAuth(clientId, clientSecret);

        MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
        map.add("grant_type", "client_credentials");

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(map, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(baseUrl + "/v1/oauth2/token", request, Map.class);
            return (String) response.getBody().get("access_token");
        } catch (Exception e) {
            // In lỗi cụ thể từ PayPal ra Console để dễ debug
            System.err.println("PayPal Auth Error: " + e.getMessage());
            throw new RuntimeException("Không thể xác thực với PayPal. Vui lòng kiểm tra Client ID/Secret.");
        }
    }

    // 2. Tạo đơn hàng trên PayPal (POST /v2/checkout/orders)
    public String createOrder(Double amount, Integer localOrderId) {
        String accessToken = getAccessToken();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(accessToken);

        // Xây dựng Body JSON bằng Map (thay cho SDK classes)
        Map<String, Object> body = new HashMap<>();
        body.put("intent", "CAPTURE");

        Map<String, Object> purchaseUnit = new HashMap<>();
        Map<String, Object> amountMap = new HashMap<>();
        amountMap.put("currency_code", "USD");
        amountMap.put("value", String.format(Locale.US, "%.2f", amount));
        purchaseUnit.put("amount", amountMap);
        purchaseUnit.put("reference_id", localOrderId.toString());

        body.put("purchase_units", Collections.singletonList(purchaseUnit));

        Map<String, String> appContext = new HashMap<>();
        appContext.put("return_url", "http://localhost:8080/api/users/payment/paypal-callback?orderId=" + localOrderId);
        appContext.put("cancel_url", "http://localhost:8080/api/users/payment/cancel?orderId=" + localOrderId);
        appContext.put("user_action", "PAY_NOW");
        body.put("application_context", appContext);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(baseUrl + "/v2/checkout/orders", request, Map.class);

        // Lấy link approve từ mảng "links" trong JSON trả về
        List<Map<String, String>> links = (List<Map<String, String>>) response.getBody().get("links");
        return links.stream()
                .filter(link -> "approve".equals(link.get("rel")))
                .findFirst()
                .get()
                .get("href");
    }

    // 3. Xác nhận thanh toán (POST /v2/checkout/orders/{id}/capture)
    public String captureOrderAndGetId(String paypalOrderId) {
        String accessToken = getAccessToken();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(accessToken);

        HttpEntity<String> request = new HttpEntity<>("{}", headers);
        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    baseUrl + "/v2/checkout/orders/" + paypalOrderId + "/capture",
                    request,
                    Map.class
            );

            if (response.getStatusCode() == HttpStatus.CREATED || response.getStatusCode() == HttpStatus.OK) {
                Map body = response.getBody();
                // Lấy Capture ID từ cấu trúc JSON: purchase_units[0].payments.captures[0].id
                List purchaseUnits = (List) body.get("purchase_units");
                Map firstUnit = (Map) purchaseUnits.get(0);
                Map payments = (Map) firstUnit.get("payments");
                List captures = (List) payments.get("captures");
                Map firstCapture = (Map) captures.get(0);

                return (String) firstCapture.get("id"); // Trả về ID dùng để refund sau này
            }
        } catch (Exception e) {
            System.err.println("Capture Error: " + e.getMessage());
        }
        return null;
    }

    // Trong PayPalService.java
    public boolean refundOrder(String captureId, Double amount) {
        String accessToken = getAccessToken(); // Lấy token như cũ

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(accessToken);

        // Xây dựng body cho yêu cầu hoàn tiền
        Map<String, Object> body = new HashMap<>();
        Map<String, String> amountMap = new HashMap<>();
        amountMap.put("currency_code", "USD");
        amountMap.put("value", String.format(Locale.US, "%.2f", amount));
        body.put("amount", amountMap);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            // Gọi API refund của PayPal: POST /v2/payments/captures/{capture_id}/refund
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    baseUrl + "/v2/payments/captures/" + captureId + "/refund",
                    request,
                    Map.class
            );
            return response.getStatusCode() == HttpStatus.CREATED
                    || "COMPLETED".equals(response.getBody().get("status"));
        } catch (Exception e) {
            System.err.println("PayPal Refund Error: " + e.getMessage());
            return false;
        }
    }
}
