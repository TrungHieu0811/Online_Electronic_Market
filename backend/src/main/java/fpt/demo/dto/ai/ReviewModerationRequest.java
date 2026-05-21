package fpt.demo.dto.ai;

import lombok.Data;

@Data
public class ReviewModerationRequest {
    private String content;
    private Integer rating;
    private Integer productId;
    private Integer userId;
}