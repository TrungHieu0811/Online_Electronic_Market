package fpt.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class InventoryForecastDto {
    private Integer productId;
    private String productName;
    private Integer currentStock;
    private Double avgDailySales7Days;
    private Double avgDailySales30Days;
    private Integer predictedDemand7Days;
    private Integer predictedDemand30Days;
    private Integer daysUntilOutOfStock;
    private String stockStatus;
}