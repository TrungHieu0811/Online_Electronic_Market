package fpt.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ReorderSuggestionDto {
    private Integer productId;
    private String productName;
    private Integer currentStock;
    private Integer predictedDemand30Days;
    private Integer recommendedStock;
    private Integer reorderQuantity;
    private String priority;
}