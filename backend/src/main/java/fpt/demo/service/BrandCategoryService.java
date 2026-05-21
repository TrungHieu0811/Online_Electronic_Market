package fpt.demo.service;

import fpt.demo.entity.Brand;
import fpt.demo.entity.BrandCategory;
import fpt.demo.entity.Category;
import fpt.demo.repository.BrandCategoryRepository;
import fpt.demo.repository.BrandRepository;
import fpt.demo.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BrandCategoryService {

  private final BrandCategoryRepository brandCategoryRepository;
  private final BrandRepository brandRepository;
  private final CategoryRepository categoryRepository;

  // Lấy Brand cho trang Public
  public List<Brand> getBrandsByCategory(String slug) {
    return brandCategoryRepository.findBrandsByCategorySlug(slug);
  }

  // Admin thiết lập: Một danh mục có những hãng nào
  @Transactional
  public void updateCategoryBrands(Integer brandId, List<Integer> categoriesIds) {
    // 1. Tìm Brand một lần duy nhất trước vòng lặp
    Brand brand = brandRepository.findById(brandId)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy thương hiệu với ID: " + brandId));

    // 2. Xóa các liên kết cũ
    brandCategoryRepository.deleteByBrandId(brandId);

    // 3. Nếu danh sách truyền vào trống thì dừng tại đây (đã xóa xong)
    if (categoriesIds == null || categoriesIds.isEmpty()) {
      return;
    }

    // 4. Lấy tất cả Category cần thiết trong 1 câu Query duy nhất (Thay vì loop và findById)
    List<Category> categories = categoryRepository.findAllById(categoriesIds);

    // 5. Tạo danh sách các đối tượng BrandCategory mới
    List<BrandCategory> newLinks = categories.stream().map(category -> {
      BrandCategory bc = new BrandCategory();
      bc.setBrand(brand);
      bc.setCategory(category);
      return bc;
    }).toList();

    // 6. Lưu tất cả một lần duy nhất (Batch Insert)
    brandCategoryRepository.saveAll(newLinks);
  }
}
