package fpt.demo.service;

import fpt.demo.dto.ProductFilterRequestDto;
import fpt.demo.entity.Category;
import fpt.demo.entity.Product;
import fpt.demo.repository.CategoryRepository;
import fpt.demo.repository.ProductRepository;
import fpt.demo.specification.ProductSpecification;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

  private final ProductRepository productRepo;
  private final CategoryRepository categoryRepo;

  @Override
  public Page<Product> filterProducts(ProductFilterRequestDto request, int page, int size) {
    // 1. Lấy spec cơ bản từ DTO (đã bao gồm keyword, brands, categories, price, attributes)
    Specification<Product> spec = ProductSpecification.getSpecFromRequest(request);

    // 2. Xử lý logic "Show Variant" đặc thù cho Category
    // Nếu request có truyền categoryId, ta kiểm tra cấu hình của Category đó
    if (request.getCategoryIds() != null && !request.getCategoryIds().isEmpty()) {
      try {
        // Lấy ID đầu tiên trong list để kiểm tra cấu hình (thường các category cùng cấp sẽ giống nhau)
        Integer firstCatId = Integer.parseInt(request.getCategoryIds().get(0));
        Category cat = categoryRepo.findById(firstCatId).orElse(null);

        if (cat != null && !cat.getShowVariantInList()) {
          // Nếu KHÔNG hiện variant: Chỉ lấy sản phẩm đại diện (isDefault = true)
          // Giả sử entity Product của bạn có field boolean isDefault
//          spec = spec.and((root, query, cb) -> cb.isTrue(root.get("isDefault")));
        }
      } catch (NumberFormatException e) {
        // log error nếu cần
      }
    }

    // 3. Phân trang và Sắp xếp mặc định
    Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

    return productRepo.findAll(spec, pageable);
  }

  // Các hàm search và getProductsByCategory cũ có thể viết lại cực ngắn bằng cách gọi hàm trên:
  @Override
  public Page<Product> getProductsByCategory(Integer categoryId, int page, int size) {
    ProductFilterRequestDto request = new ProductFilterRequestDto();
    request.setCategoryIds(List.of(String.valueOf(categoryId)));
    return this.filterProducts(request, page, size);
  }

  @Override
  public Page<Product> search(String name, Integer groupId, Double min, Double max, int page, int size) {
    ProductFilterRequestDto request = new ProductFilterRequestDto();
    request.setKeyword(name);
    if (groupId != null) {
      request.setCategoryIds(List.of(String.valueOf(groupId)));
    }
    request.setMinPrice(min);
    request.setMaxPrice(max);
    return this.filterProducts(request, page, size);

  }

  @Override
  public List<Product> getFeaturedProducts() {
    return productRepo.findByIsFeaturedTrueAndStatus("ACTIVE");
  }

  @Override
  public List<Product> getNewestProducts() {
    return productRepo.findTop10ByOrderByCreatedAtDesc();
  }

  @Override
  public Product getById(Integer id) {
    return productRepo.findById(id).orElseThrow();
  }

  @Override
  public Product getBySlug(String slug) {
    return productRepo.findBySlug(slug).orElseThrow();
  }

  @Override
  @Transactional
  public Product save(Product product) {
    return productRepo.save(product);
  }

  @Override
  @Transactional
  public void updateStatus(Integer id, String status) {
    productRepo.updateStatus(id, status);
  }
}
