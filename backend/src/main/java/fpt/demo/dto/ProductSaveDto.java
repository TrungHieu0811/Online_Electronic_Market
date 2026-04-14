package fpt.demo.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class ProductSaveDto {
  // Thông tin định danh nhóm

  @NotNull(message = "Please select product group")
  private Integer groupId;

  // Thông tin biến thể sản phẩm
  @NotBlank(message = "Variant name can not be blank")
  private String variantName;
  @NotBlank(message = "Slug can not be blank")
  private String slug;
  @NotBlank(message = "Summary can not be blank")
  private String summary;
  @NotBlank(message = "Description can not be blank")
  private String description;

  @NotNull(message = "Import price can not be blank")
  @Min(value = 0, message = "must be > 0")
  private Double importPrice;
  @NotNull(message = "base price can not be blank")
  @Min(value = 0, message = "must be > 0")
  private Double basePrice; // Giá niêm yết
  @NotNull(message = "sale price can not be blank")
  @Min(value = 0, message = "must be > 0")
  private Double salePrice; // Giá bán thực tế

  @NotNull(message = "Stock can not be blank")
  private Integer stockQuantity;
  @NotNull(message = "warranty Months can not be blank")
  private Integer warrantyMonths;
  private Boolean isFeatured;
  private String status;

  private List<String> imageUrls;

  // Danh sách các thuộc tính kỹ thuật (RAM, CPU, Pin...)
  private List<ProductAttributeDto> attributes;

}
