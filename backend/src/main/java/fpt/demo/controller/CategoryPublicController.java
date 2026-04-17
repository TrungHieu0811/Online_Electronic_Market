package fpt.demo.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import fpt.demo.entity.Brand;
import fpt.demo.entity.Category;
import fpt.demo.entity.CategoryFilterConfig;
import fpt.demo.service.BrandCategoryService;
import fpt.demo.service.CategoryFilterConfigService;
import fpt.demo.service.CategoryService;
import lombok.RequiredArgsConstructor;
import tools.jackson.databind.JsonNode;

@RestController
@RequestMapping("/api/public/categories")
@RequiredArgsConstructor
public class CategoryPublicController {

  private final CategoryService categoryService;
  private final BrandCategoryService brandCategoryService;
  private final CategoryFilterConfigService filterService;

  @GetMapping("/tree")
  public ResponseEntity<?> getCategoryTree(Authentication auth) {
    boolean isAdmin = auth != null && auth.getAuthorities().stream()
        .anyMatch(a -> a.getAuthority().equals("ROLE_SUPERADMIN")
            || a.getAuthority().equals("ROLE_STAFF"));

    return ResponseEntity.ok(categoryService.getRootCategories(isAdmin));
  }

  @GetMapping
  public ResponseEntity<List<Category>> getAllActive() {
    // Bạn có thể dùng hàm getAllActive hoặc viết thêm hàm findAll trong Service
    return ResponseEntity.ok(categoryService.getAllActive());
  }

  @GetMapping("/{slug}/brands")
  public ResponseEntity<List<Brand>> getBrandsByCategory(@PathVariable String slug) {
    return ResponseEntity.ok(brandCategoryService.getBrandsByCategory(slug));
  }

  @GetMapping("/{parentSlug}")
  public ResponseEntity<List<Category>> getChildren(@PathVariable String parentSlug) {
    // Lấy danh mục gốc kèm theo con (Fetch join trong repo)
    return ResponseEntity.ok(categoryService.getChildren(parentSlug));
  }

  // @GetMapping("/{slug}/filter-config")
  // // API: /api/public/categories/{slug}/filter-config
  // public ResponseEntity<?> getFilterConfig(@PathVariable String slug,
  // Authentication auth) {
  // boolean isAdmin = auth != null && auth.getAuthorities().stream()
  // .anyMatch(a -> a.getAuthority().equals("ROLE_SUPERADMIN")
  // || a.getAuthority().equals("ROLE_STAFF"));
  // CategoryFilterConfig config = filterService.getConfigBySlug(slug);
  // if (config == null) {
  // return ResponseEntity.notFound().build();
  // }
  // return ResponseEntity.ok(config.getConfigData()); // Trả về thẳng chuỗi JSON
  // }
  @GetMapping("/{slug}/filter-config")
  public ResponseEntity<?> getFilterConfig(
      @PathVariable String slug,
      Authentication auth) throws Exception {

    boolean isAdmin = auth != null && auth.getAuthorities().stream()
        .anyMatch(a -> a.getAuthority().equals("ROLE_SUPERADMIN")
            || a.getAuthority().equals("ROLE_STAFF"));

    CategoryFilterConfig config = filterService.getConfigBySlug(slug);
    if (config == null) {
      return ResponseEntity.notFound().build();
    }

    JsonNode responseData = isAdmin
        ? filterService.getFullConfig(config)
        : filterService.getPublicConfig(config);

    return ResponseEntity.ok(responseData);
  }
}
