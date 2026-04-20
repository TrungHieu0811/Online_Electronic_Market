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
    public double getShippingFee(Integer districtId, String wardCode, double totalAmount, int weight) {
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
                    (int) totalAmount
            );
            request.setWeight(weight);

            HttpEntity<GHNFeeRequest> entity = new HttpEntity<>(request, headers);

            ResponseEntity<GHNResponse<GHNFeeData>> response = restTemplate.exchange(
                    GHN_URL, HttpMethod.POST, entity, new ParameterizedTypeReference<>() {
            }
            );

            if (response.getBody() != null && response.getBody().getCode() == 200) {
                return (double) response.getBody().getData().getTotal();
            }
        } catch (Exception e) {
            System.err.println("GHN Fee Error: " + e.getMessage());
        }
        return 2.0; // Phí mặc định nếu API lỗi
    }

    @Override
    public double getActualDistance(Integer provinceId, Integer districtId, String wardCode, int weight) {
        if (districtId == null || wardCode == null) {
            return 0.0;
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Token", TOKEN);
            headers.set("ShopId", SHOP_ID);
            headers.setContentType(MediaType.APPLICATION_JSON);

            // GHN cần giá trị bảo hiểm, mình để mặc định 100.000đ để lấy distance
            GHNFeeRequest request = new GHNFeeRequest();
            request.setFromDistrictId(1452); // ID Quận Tân Bình của Shop
            request.setToDistrictId(districtId); // Quận của khách
            request.setToWardCode(wardCode); // Phường của khách
            request.setServiceTypeId(2); // Dùng mã 2 cho gói Standard
            request.setWeight(weight); // Cân nặng thật của đơn hàng
            request.setInsuranceValue(100000); // Bảo hiểm 100k

            request.setLength(20);
            request.setWidth(20);
            request.setHeight(10);

            HttpEntity<GHNFeeRequest> entity = new HttpEntity<>(request, headers);

            ResponseEntity<GHNResponse<GHNFeeData>> response = restTemplate.exchange(
                    GHN_URL, HttpMethod.POST, entity, new ParameterizedTypeReference<>() {
            }
            );

            if (response.getBody() != null && response.getBody().getCode() == 200) {
                int dist = response.getBody().getData().getDistance();

                // XỬ LÝ GIẢ LẬP KHI DATA SANDBOX SAI (Trả về 0 hoặc quá nhỏ)
                if (dist <= 300000) {
                    final Integer SHOP_PROVINCE_ID = 202; // TP.HCM
                    final Integer SHOP_DISTRICT_ID = 1452; // Quận Tân Bình
                    String regionPrefix = (wardCode != null && wardCode.length() > 0) ? wardCode.substring(0, 1) : "";

                    // 1. ƯU TIÊN SỐ 1: KIỂM TRA NỘI THÀNH (CÙNG TỈNH HCM)
                    if (provinceId != null && provinceId.equals(SHOP_PROVINCE_ID)) {
                        if (districtId.equals(SHOP_DISTRICT_ID)) {
                            dist = 2000; // Cùng quận Tân Bình: 2km
                        } else {
                            // Khác quận trong nội thành: giả lập 5km - 15km cho thực tế
                            dist = (districtId % 10 + 6) * 1000;
                        }
                    } // 2. ƯU TIÊN SỐ 2: MIỀN BẮC (Đầu số phường 1, 2, 3)
                    else if (regionPrefix.equals("1") || regionPrefix.equals("2") || regionPrefix.equals("3")) {
                        dist = (1700 + (provinceId % 50)) * 1000;
                    } // 3. ƯU TIÊN SỐ 3: MIỀN TRUNG (Xử lý riêng Đà Nẵng hoặc đầu số 4)
                    else if (provinceId == 202 || regionPrefix.equals("4")) {
                        dist = 950000; // Mặc định Đà Nẵng/Miền Trung tầm 950km
                    } // 4. ƯU TIÊN SỐ 4: MIỀN NAM & CÁC TỈNH CÒN LẠI (Đầu số 5, 7, 8, 9...)
                    else {
                        // Các tỉnh lân cận như Vũng Tàu, Đồng Nai...
                        dist = (100 + (provinceId % 50)) * 1000;
                    }
                }
                System.out.println("KHOẢNG CÁCH SAU XỬ LÝ: " + dist + " mét");
                return (double) dist;
            }
        } catch (Exception e) {
            System.err.println("Lỗi lấy khoảng cách GHN: " + e.getMessage());
        }
        return 0.0;
    }
}
