package fpt.demo.dto.ai;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SuggestReviewRequest {

    @NotNull(message = "Rating is required")
    @Min(value = 1)
    @Max(value = 5)
    private Integer rating;

    private String productName;
    private String categoryName;
    private Integer productId;
    private Integer userId;
}