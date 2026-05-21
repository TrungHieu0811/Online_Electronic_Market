package fpt.demo.service;

import fpt.demo.entity.Category;
import java.util.List;

public interface CategoryService {

  List<Category> getRootCategories(Boolean isadmin); // Lấy menu cấp 1 (Điện thoại, Laptop...)

  List<Category> getChildren(String parentSlug); // Lấy menu con

  List<Category> getAllActive();

  List<Category> getAll();

  List<Category> getByBrand(Integer id);

  Category getById(Integer id);

  Category getBySlug(String slug);

  Category save(Category category);

  void changeStatus(Integer id); // Soft delete bằng cách đổi status = false

}
