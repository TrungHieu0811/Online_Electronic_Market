package fpt.demo.service;

import fpt.demo.entity.Brand;
import fpt.demo.repository.BrandRepository;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor // Lombok tự tạo Constructor để Inject Repository
public class BrandServiceImpl implements BrandService {

  private final BrandRepository brandRepository;

  @Override
  public List<Brand> findAll() {
    return brandRepository.findAll();
  }

  @Override
  public List<Brand> getAllActive() {
    return brandRepository.findByStatusTrue();
  }

  @Override
  public List<Brand> searchBrands(String name) {
    return brandRepository.searchByName(name);
  }

  @Override
  public Brand findById(Integer id) {
    return brandRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy thương hiệu ID: " + id));
  }

  @Override
  public Brand getBySlug(String slug) {
    return brandRepository.findBySlug(slug)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy thương hiệu: " + slug));
  }

  @Override
  @Transactional
  public Brand create(Brand brand) {
    return brandRepository.save(brand);
  }

  @Override
  @Transactional
  public Brand update(Integer id, Brand brand) {
    Brand existing = findById(id);
    existing.setName(brand.getName());
    existing.setSlug(brand.getSlug());
    existing.setLogoUrl(brand.getLogoUrl());
    existing.setStatus(brand.getStatus());
    return brandRepository.save(existing);
  }

  @Override
  @Transactional
  public void changeStatus(Integer id) {
//    Brand brand = findById(id);
//    brand.setStatus(false); // Ưu tiên soft delete để không mất data liên kết
//    brandRepository.save(brand);
    brandRepository.changeStatus(id);
  }
}
