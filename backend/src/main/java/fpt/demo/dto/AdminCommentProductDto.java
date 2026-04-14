package fpt.demo.dto;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class AdminCommentProductDto {
    private Integer productId;
    private String productName;
    private String productThumbnail;
    private Long newCommentCount;
    private String latestCommentPreview;
    private LocalDateTime latestCommentAt;
}