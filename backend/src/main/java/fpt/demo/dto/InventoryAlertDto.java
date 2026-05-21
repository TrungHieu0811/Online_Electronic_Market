package fpt.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class InventoryAlertDto {
    private Integer productId;
    private String productName;
    private Integer currentStock;
    private Integer predictedDailySales;
    private Integer daysUntilOutOfStock;
    private String level; // CRITICAL / WARNING
}