package fpt.demo.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import fpt.demo.dto.CategoryCreateDto;
import fpt.demo.entity.Category;
import fpt.demo.service.CategoryFilterConfigService;
import fpt.demo.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/categories")
@RequiredArgsConstructor
public class CategoryAdminController {

  private final CategoryService categoryService;
  private final CategoryFilterConfigService filterService;

  // Admin thường cần xem tất cả danh mục để quản lý (kể cả đã ẩn)
  @GetMapping
  public ResponseEntity<List<Category>> getAll() {
    // Bạn có thể dùng hàm getAllActive hoặc viết thêm hàm findAll trong Service
    return ResponseEntity.ok(categoryService.getAll());
  }

  @GetMapping("/{id}")
  public ResponseEntity<Category> getById(@PathVariable Integer id) {
    return ResponseEntity.ok(categoryService.getById(id));
  }

  // Thêm mới danh mục (Có thể chọn parentId để làm danh mục con)
  @PostMapping
  public ResponseEntity<Category> create(@Valid @RequestBody CategoryCreateDto categoryDto) {
    // Gọi service xử lý logic convert từ DTO sang Entity và lưu
    Category newCate = new Category();
    newCate.setName(categoryDto.getName());
    newCate.setSlug(categoryDto.getSlug());
    Category parentCate = null;
    if (categoryDto.getParentId() != null) {
      parentCate = categoryService.getById(categoryDto.getParentId());
    }
    newCate.setParent(parentCate);
    newCate.setShowVariantInList(categoryDto.getShowVariantInList());
    Category savedCategory = categoryService.save(newCate);
    return new ResponseEntity<>(savedCategory, HttpStatus.CREATED);
  }

  // Cập nhật thông tin danh mục (Tên, Slug, trạng thái hiển thị variant...)
  @PutMapping("/{id}")
  public ResponseEntity<Category> update(
      @PathVariable Integer id,
      @Valid @RequestBody CategoryCreateDto categoryDto) {
    Category existingCate = categoryService.getById(id);

    existingCate.setName(categoryDto.getName());
    existingCate.setSlug(categoryDto.getSlug());
    existingCate.setShowVariantInList(categoryDto.getShowVariantInList());

    Category parentCate = null;
    if (categoryDto.getParentId() != null) {
      if (id.equals(categoryDto.getParentId())) {
        throw new RuntimeException("Danh mục cha không thể là chính nó");
      }
      parentCate = categoryService.getById(categoryDto.getParentId());
    }
    existingCate.setParent(parentCate);

    // 4. Lưu lại (Lúc này hàm save sẽ thực hiện câu lệnh UPDATE vì object đã có ID)
    Category updatedCategory = categoryService.save(existingCate);

    return ResponseEntity.ok(updatedCategory);
  }

  // change status
  @PutMapping("/changestatus/{id}")
  public ResponseEntity<Void> changeStatus(@PathVariable Integer id) {
    categoryService.changeStatus(id);
    return ResponseEntity.noContent().build();
  }

  @RestController
  @RequestMapping("/api/admin/filter-configs")
  @RequiredArgsConstructor
  public class CategoryFilterAdminController {

    @PutMapping("/{slug}")
    public ResponseEntity<?> updateConfig(@PathVariable String slug, @RequestBody String jsonConfig) {
      return ResponseEntity.ok(filterService.saveConfig(slug, jsonConfig));
    }
  }
}
