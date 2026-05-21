package fpt.demo.service;

import fpt.demo.dto.ProductFilterRequestDto;
import fpt.demo.entity.Product;
import java.util.List;
import org.springframework.data.domain.Page;

public interface ProductService {
  // Cho Trang Home & Danh mục

  Page<Product> getProductsByCategory(Integer categoryId, int page, int size, boolean isAdmin);

  List<Product> getFeaturedProducts();

  List<Product> getNewestProducts();

  // Chi tiết sản phẩm
  Product getById(Integer id);

  Product getBySlug(String slug);

  Page<Product> filterProducts(ProductFilterRequestDto request, int page, int size, boolean isAdmin);

  // Admin & Search
  Page<Product> search(String name, Integer groupId, Double min, Double max, int page, int size, boolean isAdmin);

  Product save(Product product);

  void updateStatus(Integer id, String status);
}
