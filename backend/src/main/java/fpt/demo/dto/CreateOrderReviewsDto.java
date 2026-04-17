package fpt.demo.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class CreateOrderReviewsDto {

    @NotEmpty(message = "Review list must not be empty")
    @Valid
    private List<CreateOrderItemReviewDto> reviews;
}