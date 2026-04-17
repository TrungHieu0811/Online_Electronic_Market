package fpt.demo.service;

import fpt.demo.entity.Brand;
import java.util.List;

public interface BrandService {

  List<Brand> findAll();
  List<Brand> getAllActive(); // Lấy logo các hãng hiện trang chủ

  List<Brand> searchBrands(String name); // Cho trang Admin

  Brand findById(Integer id);

  Brand getBySlug(String slug);

  Brand create(Brand brand);

  Brand update(Integer id, Brand brand);

  void changeStatus(Integer id); // Soft delete bằng cách đổi status = false
}
