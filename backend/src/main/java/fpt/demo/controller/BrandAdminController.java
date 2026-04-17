package fpt.demo.controller;

import fpt.demo.dto.BrandCreateDto;
import fpt.demo.dto.BrandUpdateDto;
import fpt.demo.entity.Brand;
import fpt.demo.service.BrandService;
import fpt.demo.service.FileStorageService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/brands")
@RequiredArgsConstructor
public class BrandAdminController {

  private final BrandService brandService;

  private final FileStorageService fileStorageService;

  @GetMapping
  public ResponseEntity<List<Brand>> findByName(
          @RequestParam(defaultValue = "") String name) {
    return ResponseEntity.ok(brandService.searchBrands(name));
  }

  @GetMapping("/{id}")
  public ResponseEntity<Brand> findById(@PathVariable Integer id) {
    return ResponseEntity.ok(brandService.findById(id));
  }

  @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<Brand> createBrand(@ModelAttribute @Valid BrandCreateDto dto) {
    Brand brand = new Brand();
    brand.setName(dto.getName());
    brand.setSlug(dto.getSlug());

    // Xử lý file ảnh nếu có
    if (dto.getLogoFile() != null && !dto.getLogoFile().isEmpty()) {
      String filePath = fileStorageService.saveFile(dto.getLogoFile(), "brands");
      brand.setLogoUrl(filePath);
    }
    return ResponseEntity.status(HttpStatus.CREATED).body(brandService.create(brand));
  }

  @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<Brand> updateBrand(
          @PathVariable Integer id,
          @ModelAttribute @Valid BrandUpdateDto dto) {

    // Lấy brand hiện tại từ DB
    Brand existingBrand = brandService.findById(id);
    if (dto.getName() != null && !dto.getName().isEmpty()) {
      existingBrand.setName(dto.getName());
    }
    if (dto.getSlug() != null && !dto.getSlug().isEmpty()) {
      existingBrand.setSlug(dto.getSlug());
    }

    // Nếu có file mới gửi lên
    if (dto.getLogoFile() != null && !dto.getLogoFile().isEmpty()) {
      // Xóa file cũ để tiết kiệm dung lượng server
      if (existingBrand.getLogoUrl() != null) {
        fileStorageService.deleteFile(existingBrand.getLogoUrl());
      }
      // Lưu file mới
      String newFilePath = fileStorageService.saveFile(dto.getLogoFile(), "brands");
      existingBrand.setLogoUrl(newFilePath);
    }

    return ResponseEntity.ok(brandService.update(id, existingBrand));
  }

  // 4. Thay đổi trạng thái ẩn/hiện (Thay vì xóa)
  @PatchMapping("/{id}/status")
  public ResponseEntity<Void> changeStatus(@PathVariable Integer id) {
    brandService.changeStatus(id);
    return ResponseEntity.noContent().build();
  }
}
