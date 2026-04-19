package fpt.demo.dto;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class CommentNotificationDto {
    private Integer id;
    private String title;
    private String message;
    private Integer productId;
    private Integer commentId;
    private Boolean isRead;
    private LocalDateTime createdAt;
}