package fpt.demo.controller;

import fpt.demo.dto.ProductGroupCreateDto;
import fpt.demo.dto.ProductGroupSummaryDTO;
import fpt.demo.dto.ProductGroupUpdateDto;
import fpt.demo.entity.Brand;
import fpt.demo.entity.Category;
import fpt.demo.entity.ProductGroup;
import fpt.demo.repository.BrandRepository;
import fpt.demo.repository.CategoryRepository;
import fpt.demo.repository.ProductGroupRepository;
import fpt.demo.service.BrandService;
import fpt.demo.service.CategoryService;
import fpt.demo.service.ProductGroupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
  public ResponseEntity<Page<ProductGroup>> getAll(
          @RequestParam(defaultValue = "0") int page,
          @RequestParam(defaultValue = "10") int size) {
    return ResponseEntity.ok(productGroupService.getAll(page, size));
  }

  @GetMapping("/search")
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

  /**
   * GET /api/admin/product-group/summaries
   *
   * Params: search - tìm theo tên group (optional) brandId - filter theo brand
   * (optional) categoryId - filter theo category (optional) page - default 0
   * size - default 12 sort - newest | name_asc | name_desc | count_desc |
   * count_asc
   */
  @GetMapping("/summaries")
  public ResponseEntity<Page<ProductGroupSummaryDTO>> getSummaries(
          @RequestParam(required = false) String search,
          @RequestParam(required = false) Integer brandId,
          @RequestParam(required = false) Integer categoryId,
          @RequestParam(defaultValue = "0") int page,
          @RequestParam(defaultValue = "12") int size,
          @RequestParam(defaultValue = "newest") String sort) {

    Pageable pageable = PageRequest.of(page, size, resolveSort(sort));

    return ResponseEntity.ok(
            productGroupService.getGroupSummaries(search, brandId, categoryId, pageable));
  }

  // Map sort string → Spring Sort object
  private Sort resolveSort(String sort) {
    return switch (sort) {
      case "name_asc" ->
        Sort.by(Sort.Direction.ASC, "name");
      case "name_desc" ->
        Sort.by(Sort.Direction.DESC, "name");
      case "count_desc" ->
        Sort.by(Sort.Direction.DESC, "variantCount");
      case "count_asc" ->
        Sort.by(Sort.Direction.ASC, "variantCount");
      default ->
        Sort.by(Sort.Direction.DESC, "id"); // newest
    };
  }
}
