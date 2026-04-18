package fpt.demo.controller;

import fpt.demo.entity.ProductGroup;
import fpt.demo.service.ProductGroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.data.domain.Page;

@RestController
@RequestMapping("/api/public/product-group")
@RequiredArgsConstructor
public class ProductGroupPublicController {

  private final ProductGroupService productGroupService;

  // Lấy tất cả nhóm đang kinh doanh (để hiện danh sách lọc trên React/Flutter)
  @GetMapping("/active")
  public ResponseEntity<Page<ProductGroup>> getAllActive(
          @RequestParam(defaultValue = "0") int page,
          @RequestParam(defaultValue = "10") int size) {
    return ResponseEntity.ok(productGroupService.getAllActive(page, size));
  }

  // Lấy các nhóm sản phẩm theo Danh mục (VD: Lấy các nhóm thuộc "Laptop")
  @GetMapping("/category/{categoryId}")
  public ResponseEntity<Page<ProductGroup>> getByCategoryId(@PathVariable Integer categoryId,
          @RequestParam(defaultValue = "0") int page,
          @RequestParam(defaultValue = "10") int size) {
    return ResponseEntity.ok(productGroupService.getByCategoryId(categoryId, page, size));
  }

  // Lấy các nhóm sản phẩm theo Thương hiệu (VD: Lấy các nhóm của "Apple")
  @GetMapping("/brand/{brandId}")
  public ResponseEntity<Page<ProductGroup>> getByBrandId(@PathVariable Integer brandId,
          @RequestParam(defaultValue = "0") int page,
          @RequestParam(defaultValue = "10") int size) {
    return ResponseEntity.ok(productGroupService.getByBrandId(brandId, page, size));
  }
}
