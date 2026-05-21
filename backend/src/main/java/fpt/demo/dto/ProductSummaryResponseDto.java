/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package fpt.demo.dto;

import java.util.List;
import lombok.Data;

/**
 *
 * @author Admin
 */
@Data
public class ProductSummaryResponseDto {

  private Integer id;
  private String variantName;
  private String slug;
  private String summary;
  private String description;

  private Double basePrice;
  private Double salePrice;
  private Integer stockQuantity;
  private String status;

  private Integer warrantyMonths;
  private Boolean isFeatured;
  private Integer viewCount;
  private Double averageRating;

  private BrandResponseDto brand;
  private CategoryResponseDto category;
  private List<ProductImageSummaryDto> imageList;

}
