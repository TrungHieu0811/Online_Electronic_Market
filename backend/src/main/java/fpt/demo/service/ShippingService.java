/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Interface.java to edit this template
 */
package fpt.demo.service;

/**
 *
 * @author hmn27
 */
public interface ShippingService {
    double getShippingFee(Integer districtId, String wardCode, double totalAmount, int weight);
    
    Object getGHNProvinces();
    
    double getActualDistance(Integer provinceId, Integer districtId, String wardCode, int weight);
}
