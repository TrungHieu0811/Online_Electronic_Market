/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package fpt.demo.dto;

import lombok.Data;

/**
 *
 * @author Admin
 */
@Data
public class ProductGroupResponseDto {

  private Integer id;
  private String name;
  private Integer categoryId;
  private Integer brandId;
  private Boolean status;

}
