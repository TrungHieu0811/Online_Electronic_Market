package fpt.demo.service;

import fpt.demo.dto.ProductGroupSummaryDTO;
import fpt.demo.entity.ProductGroup;
import org.springframework.data.domain.Page;
import java.util.List;
import org.springframework.data.domain.Pageable;

public interface ProductGroupService {
  // Cho User

  Page<ProductGroup> getAll(int page, int size);

  Page<ProductGroup> getAllActive(int page, int size);

  Page<ProductGroup> getByCategoryId(Integer categoryId, int page, int size);

  Page<ProductGroup> getByBrandId(Integer brandId, int page, int size);

  ProductGroup findById(Integer id);

  // Cho Admin
  Page<ProductGroup> searchGroups(String name, int page, int size);

  ProductGroup create(ProductGroup group);

  ProductGroup update(Integer id, ProductGroup group);

  void delete(Integer id);

  // ProductGroupService.java (interface) — thêm:
  Page<ProductGroupSummaryDTO> getGroupSummaries(
          String search, Integer brandId, Integer categoryId, Pageable pageable);
}
