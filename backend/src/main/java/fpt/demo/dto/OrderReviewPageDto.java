package fpt.demo.dto;

import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OrderReviewPageDto {
    private Integer orderId;
    private String status;
    private List<OrderReviewItemDto> items;
}