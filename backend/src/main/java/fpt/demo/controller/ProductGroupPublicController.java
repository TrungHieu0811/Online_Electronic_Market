package fpt.demo.controller;

import fpt.demo.entity.ProductGroup;
import fpt.demo.service.ProductGroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/public/product-group")
@RequiredArgsConstructor
public class ProductGroupPublicController {

  private final ProductGroupService productGroupService;

  // Lấy tất cả nhóm đang kinh doanh (để hiện danh sách lọc trên React/Flutter)
  @GetMapping("/active")
  public ResponseEntity<List<ProductGroup>> getAllActive() {
    return ResponseEntity.ok(productGroupService.getAllActive());
  }

  // Lấy các nhóm sản phẩm theo Danh mục (VD: Lấy các nhóm thuộc "Laptop")
  @GetMapping("/category/{categoryId}")
  public ResponseEntity<List<ProductGroup>> getByCategoryId(@PathVariable Integer categoryId) {
    return ResponseEntity.ok(productGroupService.getByCategoryId(categoryId));
  }

  // Lấy các nhóm sản phẩm theo Thương hiệu (VD: Lấy các nhóm của "Apple")
  @GetMapping("/brand/{brandId}")
  public ResponseEntity<List<ProductGroup>> getByBrandId(@PathVariable Integer brandId) {
    return ResponseEntity.ok(productGroupService.getByBrandId(brandId));
  }
}
