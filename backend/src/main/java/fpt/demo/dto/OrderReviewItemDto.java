package fpt.demo.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OrderReviewItemDto {
    private Integer id;        // orderItemId
    private Integer productId;
    private String name;
    private String variant;
    private String image;
}