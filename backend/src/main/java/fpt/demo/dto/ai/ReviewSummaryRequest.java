package fpt.demo.dto.ai;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class ReviewSummaryRequest {

    @NotNull
    private Integer productId;

    @NotEmpty(message = "Reviews must not be empty")
    private List<String> reviews;
}