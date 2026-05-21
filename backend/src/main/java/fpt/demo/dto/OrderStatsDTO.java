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
public class OrderStatsDTO {
    private long totalOrders;      // Tổng số đơn hàng
    private double totalRevenue;   // Tổng doanh thu (tổng Pay Price của đơn DELIVERED)
    private long shippingOrders;   // Số đơn đang đi giao (SHIPPING)
}
