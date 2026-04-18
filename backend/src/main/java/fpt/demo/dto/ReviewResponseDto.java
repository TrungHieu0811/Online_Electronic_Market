package fpt.demo.dto;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class ReviewResponseDto {

    private Integer id;

    private Integer productId;
    private String productName;
    private String productThumbnail;

    private Integer ratingScore;

    private String comment;

    private String imageUrl;

    private String status;

    private LocalDateTime createdAt;

    private UserSimpleDto user;
}