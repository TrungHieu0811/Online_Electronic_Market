/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package fpt.demo.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 *
 * @author hmn27
 */
@Data
@AllArgsConstructor
@NoArgsConstructor // CẦN THIẾT: Để có thể dùng new GHNFeeRequest()
public class GHNFeeRequest {
    
    @JsonProperty("service_type_id")
    private int serviceTypeId; // 2: Chuẩn, 5: Nhanh

    @JsonProperty("from_district_id")
    private Integer fromDistrictId; // Điểm đi của Shop

    @JsonProperty("to_district_id")
    private int toDistrictId; // Điểm đến của khách

    @JsonProperty("to_ward_code")
    private String toWardCode;

    private int weight; // gram
    private int length;
    private int width;
    private int height;

    @JsonProperty("insurance_value")
    private int insuranceValue;

    // Enum hỗ trợ chọn gói dịch vụ
    public enum ServiceType {
        STANDARD(2), EXPRESS(5);
        private final int value;
        ServiceType(int value) { this.value = value; }
        public int getValue() { return value; }
    }

    // Constructor cũ để không làm hỏng các code cũ đang chạy
    public GHNFeeRequest(ServiceType type, int districtId, String wardCode, int insurance) {
        this.serviceTypeId = type.getValue();
        this.toDistrictId = districtId;
        this.toWardCode = wardCode;
        this.insuranceValue = insurance;
    }
}
