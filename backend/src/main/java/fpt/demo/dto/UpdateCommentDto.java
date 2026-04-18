package fpt.demo.dto;

import lombok.Data;

@Data
public class UpdateCommentDto {
    private Integer userId;
    private String content;
}