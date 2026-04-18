package fpt.demo.service;

import fpt.demo.dto.ProductGroupSummaryDTO;
import fpt.demo.entity.ProductGroup;
import fpt.demo.repository.ProductGroupRepository;
import fpt.demo.service.ProductGroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

@Service
@RequiredArgsConstructor
public class ProductGroupServiceImpl implements ProductGroupService {

  private final ProductGroupRepository productGroupRepository;

  @Override
  public Page<ProductGroup> getAll(int page, int size) {
    Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
    return productGroupRepository.findAll(pageable);
  }

  @Override
  public Page<ProductGroup> getAllActive(int page, int size) {
    Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
    return productGroupRepository.findAllActive(pageable);
  }

  @Override
  public Page<ProductGroup> getByCategoryId(Integer categoryId, int page, int size) {
    Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
    return productGroupRepository.findByCategoryId(categoryId, pageable);
  }

  @Override
  public Page<ProductGroup> getByBrandId(Integer brandId, int page, int size) {
    Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
    return productGroupRepository.findByBrandId(brandId, pageable);
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

  @Override
  public Page<ProductGroupSummaryDTO> getGroupSummaries(
          String search, Integer brandId, Integer categoryId, Pageable pageable) {

    // Truyền null thay vì empty string để WHERE IS NULL hoạt động đúng
    String searchParam = (search == null || search.isBlank()) ? null : search.trim();

    return productGroupRepository.findGroupSummaries(
            searchParam, brandId, categoryId, pageable);
  }
}
