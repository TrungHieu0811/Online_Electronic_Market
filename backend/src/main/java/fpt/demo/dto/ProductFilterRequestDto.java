package fpt.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductFilterRequestDto {

  // filter by name contains
  private String keyword;

  // filter brands list
  private List<String> brandIds;

  // filter categories list
  private List<String> categoryIds;

  // filter between minPrice and maxPrice
  private Double minPrice;
  private Double maxPrice;

  // filter Map Attributes
  // exp: {"RAM": ["8GB", "16GB"], "color": ["black"]}
  private Map<String, List<String>> attributes;
}
