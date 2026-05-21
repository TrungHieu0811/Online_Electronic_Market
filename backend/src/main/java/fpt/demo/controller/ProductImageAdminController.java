package fpt.demo.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import fpt.demo.entity.Product;
import fpt.demo.entity.ProductImage;
import fpt.demo.service.ProductImageService;
import fpt.demo.service.ProductService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/product-image")
@RequiredArgsConstructor
public class ProductImageAdminController {

  private final ProductImageService productImageService;
  private final ProductService productService;

  // Lấy danh sách ảnh của 1 sản phẩm cụ thể để hiển thị trong trang quản lý album
  @GetMapping("/product/{productId}")
  public ResponseEntity<List<ProductImage>> getByProduct(@PathVariable Integer productId) {
    return ResponseEntity.ok(productImageService.getByProductId(productId));
  }

  // Thêm mới 1 ảnh cho sản phẩm
  @PostMapping("/{productId}")
  public ResponseEntity<ProductImage> addImage(@PathVariable Integer productId, @RequestBody ProductImage image) {
    Product product = productService.getById(productId);
    image.setProduct(product); // Thiết lập mối quan hệ trước khi lưu
    return new ResponseEntity<>(productImageService.save(image), HttpStatus.CREATED);
  }

  // Xóa 1 ảnh cụ thể theo ID (khi Admin bấm nút xóa trên 1 tấm hình)
  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteById(@PathVariable Integer id) {
    productImageService.deleteById(id);
    return ResponseEntity.noContent().build();
  }

  // Xóa toàn bộ album ảnh của sản phẩm (Dùng khi muốn reset hoặc xóa sản phẩm)
  @DeleteMapping("/product/{productId}")
  public ResponseEntity<Void> deleteByProduct(@PathVariable Integer productId) {
    productImageService.deleteByProductId(productId);
    return ResponseEntity.noContent().build();
  }
}
