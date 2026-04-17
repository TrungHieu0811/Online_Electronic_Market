package fpt.demo.dto;

import java.time.LocalDateTime;
import java.util.List;

import lombok.Data;

@Data
public class CommentResponseDto {

    private Integer id;
    private Integer parentId;

    private String content;
    private Boolean isAdminReply;
    private Boolean isReadByAdmin;
    private LocalDateTime adminReadAt;
    private LocalDateTime createdAt;

    private UserSimpleDto user;

    private List<CommentResponseDto> replies;
}