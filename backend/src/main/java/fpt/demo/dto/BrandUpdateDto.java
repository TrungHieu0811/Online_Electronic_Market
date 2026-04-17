package fpt.demo.dto;

import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class BrandUpdateDto {

  // private Integer id;
  @NotBlank(message = "Brand name can not be blank")
  @Size(max = 255, message = "Brand name must less than 255 characters")
  private String name;

  @NotBlank(message = "Slug can not be blank")
  @Size(max = 255, message = "Slug must less than 255 characters")
  private String slug;

  private String logoUrl;

  // Field để nhận file ảnh
  private MultipartFile logoFile;

  // private Boolean status = true; // Mặc định là true nếu không truyền
}
