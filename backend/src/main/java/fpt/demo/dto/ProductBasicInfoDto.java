package fpt.demo.dto;

import lombok.Data;

@Data
public class ProductBasicInfoDto {
    private Integer id;
    private String variantName;
    private String slug;
}