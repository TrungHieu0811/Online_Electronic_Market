package fpt.demo.controller;

import fpt.demo.entity.Category;
import fpt.demo.service.CategoryService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/categories")
@RequiredArgsConstructor
public class CategoryPublicController {

  private final CategoryService categoryService;

  @GetMapping("/tree")
  public ResponseEntity<?> getCategoryTree() {
    // Lấy danh mục gốc kèm theo con (Fetch join trong repo)
    return ResponseEntity.ok(categoryService.getRootCategories());
  }

  @GetMapping
  public ResponseEntity<List<Category>> getAllActive() {
    // Bạn có thể dùng hàm getAllActive hoặc viết thêm hàm findAll trong Service
    return ResponseEntity.ok(categoryService.getAllActive());
  }

  @GetMapping("/{parentId}")
  public ResponseEntity<?> getChildren(@PathVariable Integer parentId) {
    // Lấy danh mục gốc kèm theo con (Fetch join trong repo)
    return ResponseEntity.ok(categoryService.getChildren(parentId));
  }
}
