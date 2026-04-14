package fpt.demo.service;

import fpt.demo.entity.ProductGroup;
import fpt.demo.repository.ProductGroupRepository;
import fpt.demo.service.ProductGroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductGroupServiceImpl implements ProductGroupService {

  private final ProductGroupRepository productGroupRepository;

  @Override
  public List<ProductGroup> getAllActive() {
    return productGroupRepository.findAllActive();
  }

  @Override
  public List<ProductGroup> getByCategoryId(Integer categoryId) {
    return productGroupRepository.findByCategoryId(categoryId);
  }

  @Override
  public List<ProductGroup> getByBrandId(Integer brandId) {
    return productGroupRepository.findByBrandId(brandId);
  }

  @Override
  public ProductGroup findById(Integer id) {
    return productGroupRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy nhóm sản phẩm ID: " + id));
  }

  @Override
  public Page<ProductGroup> searchGroups(String name, int page, int size) {
    return productGroupRepository.searchByName(name, PageRequest.of(page, size));
  }

  @Override
  @Transactional
  public ProductGroup create(ProductGroup group) {
    // Mặc định khi tạo mới là đang kinh doanh
    group.setStatus(true);
    return productGroupRepository.save(group);
  }

  @Override
  @Transactional
  public ProductGroup update(Integer id, ProductGroup group) {
    ProductGroup existing = findById(id);

    existing.setName(group.getName());
    existing.setCategory(group.getCategory());
    existing.setBrand(group.getBrand());
    existing.setStatus(group.getStatus());

    return productGroupRepository.save(existing);
  }

  @Override
  @Transactional
  public void delete(Integer id) {
    ProductGroup group = findById(id);
    // Soft delete để tránh lỗi khóa ngoại với bảng Products
    group.setStatus(false);
    productGroupRepository.save(group);
  }
}
