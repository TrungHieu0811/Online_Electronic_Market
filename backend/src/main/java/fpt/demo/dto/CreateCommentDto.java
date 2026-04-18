package fpt.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateCommentDto {

    @NotNull(message = "ProductId cannot null")
    private Integer productId;

    private Integer groupId;

    private Integer parentId; // null = comment, có = reply

    @NotBlank(message = "Content cannot blank!")
    private String content;
}