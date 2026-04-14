package fpt.demo.controller;

import fpt.demo.dto.ProductGroupCreateDto;
import fpt.demo.dto.ProductGroupUpdateDto;
import fpt.demo.entity.Brand;
import fpt.demo.entity.Category;
import fpt.demo.entity.ProductGroup;
import fpt.demo.repository.BrandRepository;
import fpt.demo.repository.CategoryRepository;
import fpt.demo.service.BrandService;
import fpt.demo.service.CategoryService;
import fpt.demo.service.ProductGroupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/product-group")
@RequiredArgsConstructor
public class ProductGroupAdminController {

  private final ProductGroupService productGroupService;
  private final BrandService brandService;
  private final CategoryService categoryService;
  private final BrandRepository brandRepository;
  private final CategoryRepository categoryRepository;

  // Tìm kiếm phân trang (Cho trang quản lý Group trong Admin)
  @GetMapping
  public ResponseEntity<Page<ProductGroup>> search(
          @RequestParam(defaultValue = "") String name,
          @RequestParam(defaultValue = "0") int page,
          @RequestParam(defaultValue = "10") int size) {
    return ResponseEntity.ok(productGroupService.searchGroups(name, page, size));
  }

  @GetMapping("/{id}")
  public ResponseEntity<ProductGroup> getById(@PathVariable Integer id) {
    return ResponseEntity.ok(productGroupService.findById(id));
  }

  // Tạo mới một dòng sản phẩm (Chọn Category và Brand tương ứng)
  @PostMapping
  public ResponseEntity<ProductGroup> create(@Valid @RequestBody ProductGroupCreateDto dto) {
    ProductGroup group = new ProductGroup();
    group.setBrand(brandRepository.getReferenceById(dto.getBrandId()));
    group.setCategory(categoryRepository.getReferenceById(dto.getCategoryId()));
    group.setName(dto.getName());
    group.setStatus(Boolean.TRUE);
    return new ResponseEntity<>(productGroupService.create(group), HttpStatus.CREATED);
  }

  @PutMapping("/{id}")
  public ResponseEntity<ProductGroup> update(@PathVariable Integer id, @RequestBody ProductGroupUpdateDto dto) {
    ProductGroup existingGroup = productGroupService.findById(id);
    existingGroup.setName(dto.getName());
    existingGroup.setStatus(dto.getStatus());
    return ResponseEntity.ok(productGroupService.update(id, existingGroup));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable Integer id) {
    productGroupService.delete(id);
    return ResponseEntity.noContent().build();
  }
}
