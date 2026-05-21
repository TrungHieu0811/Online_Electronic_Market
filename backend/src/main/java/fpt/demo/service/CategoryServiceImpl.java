package fpt.demo.service;

import fpt.demo.entity.Category;
import fpt.demo.repository.CategoryRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

  private final CategoryRepository categoryRepository;

  @Override
  public List<Category> getRootCategories(Boolean isAdmin) {
    return categoryRepository.findRootCategories(isAdmin);
  }

  @Override
  public List<Category> getChildren(String parentSlug) {
    return categoryRepository.findChildrenByParentSlug(parentSlug);
  }

  @Override
  public List<Category> getAllActive() {
    return categoryRepository.findAllActiveSorted();
  }

  @Override
  public List<Category> getAll() {
    return categoryRepository.findAll();
  }

  @Override
  public Category getById(Integer id) {
    return categoryRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục ID: " + id));
  }

  @Override
  public Category getBySlug(String slug) {
    return categoryRepository.findBySlug(slug)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục: " + slug));
  }

  @Override
  public List<Category> getByBrand(Integer id) {
    return categoryRepository.findByBrandId(id);
  }

  @Override
  @Transactional
  public Category save(Category category) {
    // Nếu slug trống, bạn có thể viết thêm logic tự tạo slug từ name ở đây
    return categoryRepository.save(category);
  }

  @Override
  @Transactional
  public void changeStatus(Integer id) {
//    Brand brand = getById(id);
//    brand.setStatus(false); // Ưu tiên soft delete để không mất data liên kết
//    brandRepository.save(brand);
    categoryRepository.changeStatus(id);
  }

}
