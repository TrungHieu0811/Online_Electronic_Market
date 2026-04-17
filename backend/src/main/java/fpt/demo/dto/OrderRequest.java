/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package fpt.demo.dto;

import lombok.Data;

/**
 *
 * @author hmn27
 */
@Data
public class OrderRequest {
    private String paymentMethod;
    private String couponCode;
    private String shipName;
    private String shipPhone;
    private String shipAddress;
    private String note;
    private Integer districtId;
    private String wardCode;
}
