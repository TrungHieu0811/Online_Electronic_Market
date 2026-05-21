package fpt.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
public class ProductImageSummaryDto {

  private Integer id;
  private String imageUrl;
  private Integer displayOrder;
}
