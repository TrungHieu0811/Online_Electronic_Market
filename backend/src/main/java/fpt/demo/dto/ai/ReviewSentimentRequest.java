package fpt.demo.dto.ai;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ReviewSentimentRequest {

    @NotBlank(message = "Content is required")
    private String content;

    private Integer productId;
    private Integer userId;
    private Integer rating;
}
