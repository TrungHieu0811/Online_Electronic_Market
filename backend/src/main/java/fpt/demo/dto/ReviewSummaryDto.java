package fpt.demo.dto;

import lombok.Data;

@Data
public class ReviewSummaryDto {
    private Double averageRating;
    private Long totalReviews;

    private Integer fiveStarPercent;
    private Integer fourStarPercent;
    private Integer threeStarPercent;
    private Integer twoStarPercent;
    private Integer oneStarPercent;
}