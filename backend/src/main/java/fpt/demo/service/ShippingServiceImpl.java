/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package fpt.demo.service;

import fpt.demo.dto.GHNFeeData;
import fpt.demo.dto.GHNFeeRequest;
import fpt.demo.dto.GHNResponse;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

/**
 *
 * @author hmn27
 */
@Service
public class ShippingServiceImpl implements ShippingService {

    private final RestTemplate restTemplate = new RestTemplate();

    private final String GHN_URL = "https://dev-online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/fee";
    private final String TOKEN = "7929ef18-3653-11f1-a973-aee5264794df".trim(); // lấy từ trang chủ GHN
    private final String SHOP_ID = "199932";

    private final String PROVINCE_URL = "https://dev-online-gateway.ghn.vn/shiip/public-api/master-data/province";

    @Override
    public String getGHNProvinces() {
        try {
            // 1. Chuẩn hóa Token (Xóa khoảng trắng thừa)
            String cleanToken = TOKEN.trim();
            String cleanShopId = SHOP_ID.trim();

            HttpHeaders headers = new HttpHeaders();
            // 2. Ép kiểu Header Content-Type là JSON
            headers.setContentType(MediaType.APPLICATION_JSON);
            // 3. Gửi cả Token và ShopId trong Header
            headers.set("Token", cleanToken);
            headers.set("ShopId", cleanShopId);

            // 4. GHN đôi khi chặn các request không có User-Agent
            headers.set("User-Agent", "Mozilla/5.0");

            HttpEntity<String> entity = new HttpEntity<>(headers);

            System.out.println("Đang gọi GHN với Token: " + cleanToken + " và ShopId: " + cleanShopId);

            ResponseEntity<String> response = restTemplate.exchange(
                    PROVINCE_URL,
                    HttpMethod.GET,
                    entity,
                    String.class
            );

            return response.getBody();
        } catch (org.springframework.web.client.HttpClientErrorException.Unauthorized e) {
            System.err.println("GHN báo Token sai: " + e.getResponseBodyAsString());
            return null;
        } catch (Exception e) {
            System.err.println("Lỗi hệ thống khi gọi GHN: " + e.getMessage());
            return null;
        }
    }

    @Override
    public double getShippingFee(Integer districtId, String wardCode, double totalAmount) {
        if (districtId == null || wardCode == null) {
            return 0.0;
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Token", TOKEN);
            headers.set("ShopId", SHOP_ID);
            headers.setContentType(MediaType.APPLICATION_JSON);

            GHNFeeRequest request = new GHNFeeRequest(
                    GHNFeeRequest.ServiceType.STANDARD,
                    districtId,
                    wardCode,
                    (int) totalAmount // Giá trị bảo hiểm đơn hàng
            );

            HttpEntity<GHNFeeRequest> entity = new HttpEntity<>(request, headers);

            ResponseEntity<GHNResponse<GHNFeeData>> response = restTemplate.exchange(
                    GHN_URL, HttpMethod.POST, entity, new ParameterizedTypeReference<>() {
            }
            );

            if (response.getBody() != null && response.getBody().getCode() == 200) {
                // Giả sử hệ thống dùng USD, chia cho 25000 để đổi từ VNĐ (tùy tỷ giá của bạn)
                return (double) response.getBody().getData().getTotal() / 25000;
            }
        } catch (Exception e) {
            System.err.println("GHN Fee Error: " + e.getMessage());
        }
        return 2.0; // Phí mặc định nếu API lỗi
    }
}
