/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package fpt.demo.controller;

import fpt.demo.repository.BrandCategoryRepository;
import fpt.demo.service.BrandCategoryService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/brand-category")
@RequiredArgsConstructor
public class BrandCategoryAdminController {

  private final BrandCategoryService brandCategoryService;
  private final BrandCategoryRepository brandCategoryRepository;

  @GetMapping("/{id}")
  public ResponseEntity<List<Integer>> getCategoryByBrandId(@PathVariable Integer id) {
    return ResponseEntity.ok(brandCategoryRepository.findCategoryIdsByBrandId(id));
  }

  @GetMapping("/getBrandIdsByCategoryId/{id}")
  public ResponseEntity<List<Integer>> getCategoryByCategoryId(@PathVariable Integer id) {
    return ResponseEntity.ok(brandCategoryRepository.findBrandIdsByCategoryId(id));
  }

  @PostMapping("/{brandId}/categories")
  public ResponseEntity<?> linkBrands(@PathVariable Integer brandId, @RequestBody List<Integer> categoriesIds) {
    brandCategoryService.updateCategoryBrands(brandId, categoriesIds);
    return ResponseEntity.ok("Đã cập nhật thương hiệu cho danh mục!");
  }
}
