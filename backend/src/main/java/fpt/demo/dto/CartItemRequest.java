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
public class CartItemRequest {
    private Integer productId;
    private Integer quantity;
}
