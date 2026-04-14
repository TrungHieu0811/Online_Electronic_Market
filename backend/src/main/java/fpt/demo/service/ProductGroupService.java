package fpt.demo.service;

import fpt.demo.entity.ProductGroup;
import org.springframework.data.domain.Page;
import java.util.List;

public interface ProductGroupService {
  // Cho User

  List<ProductGroup> getAllActive();

  List<ProductGroup> getByCategoryId(Integer categoryId);

  List<ProductGroup> getByBrandId(Integer brandId);

  ProductGroup findById(Integer id);

  // Cho Admin
  Page<ProductGroup> searchGroups(String name, int page, int size);

  ProductGroup create(ProductGroup group);

  ProductGroup update(Integer id, ProductGroup group);

  void delete(Integer id);
}
