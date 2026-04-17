/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package fpt.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 *
 * @author hmn27
 */
@Data
@AllArgsConstructor
public class GHNFeeRequest {
    private int service_type_id; // 2: Chuẩn, 5: Nhanh
    private int to_district_id;
    private String to_ward_code;
    private int weight = 1000; // gram
    private int insurance_value;

    public enum ServiceType {
        STANDARD(2), // Gói chuẩn
        EXPRESS(5);  // Gói nhanh

        private final int value;
        ServiceType(int value) { this.value = value; }
        public int getValue() { return value; }
    }
    

    public GHNFeeRequest(ServiceType type, int districtId, String wardCode, int insurance) {
        this.service_type_id = type.getValue();
        this.to_district_id = districtId;
        this.to_ward_code = wardCode;
//        this.weight = weight;
        this.insurance_value = insurance;
    }
}
