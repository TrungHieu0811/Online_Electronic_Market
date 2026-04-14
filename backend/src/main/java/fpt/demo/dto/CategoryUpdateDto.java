package fpt.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CategoryUpdateDto {

  @NotBlank(message = "Category name can not be blank")
  @Size(max = 255, message = "Category name must less than 255 characters")
  private String name;

  @NotBlank(message = "Slug can not be blank")
  @Size(max = 255, message = "Slug must less than 255 characters")
  private String slug;

  private Integer parentId;

  private Boolean showVariantInList;

  private Boolean status;
}
