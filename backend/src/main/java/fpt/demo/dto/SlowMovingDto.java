package fpt.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SlowMovingDto {
    private Integer productId;
    private String productName;
    private Integer currentStock;
    private Integer soldLast30Days;
    private String reason;
}