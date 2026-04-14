package fpt.demo.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateReviewDto {

    @NotNull(message = "ProductId cannot null")
    private Integer productId;

    private Integer groupId;

    @NotNull(message = "UserId cannot null")
    private Integer userId;

    @NotNull(message = "OrderId cannot null")
    private Integer orderId;

    @NotNull(message = "Rating cannot null")
    @Min(value = 1, message = "Rating min is 1")
    @Max(value = 5, message = "Rating maximum is 5")
    private Integer ratingScore;

    private String comment;

    private String imageUrl;
}