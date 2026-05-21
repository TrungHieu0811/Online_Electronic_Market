/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package fpt.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 *
 * @author Admin
 */
@Data
public class ProductGroupCreateDto {

  @NotBlank(message = "Product'group name can not be blank")
  @Size(max = 255, message = "Product'group name must less than 255 characters")
  private String name;

  @NotNull(message = "Please select category")
  private Integer categoryId;

  @NotNull(message = "Please select brand")
  private Integer brandId;
}
