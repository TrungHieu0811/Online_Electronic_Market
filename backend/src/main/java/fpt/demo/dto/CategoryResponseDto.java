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
public class CategoryResponseDto {

  private Integer id;
  private String name;
  private String slug;
  private CategoryResponseDto parent;
}
