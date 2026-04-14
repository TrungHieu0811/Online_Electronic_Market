/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package fpt.demo.service;

import fpt.demo.entity.ProductAttribute;
import fpt.demo.repository.ProductAttributeRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProductAttributeServiceImpl implements ProductAttributeService {

  private final ProductAttributeRepository attributeRepo;

  @Override
  public List<ProductAttribute> getByProductId(Integer productId) {
    return attributeRepo.findAllByProductId(productId);
  }

  @Override
  @Transactional
  public void saveAll(List<ProductAttribute> attributes, Integer productId) {
    // Nguyên tắc: Xóa sạch thuộc tính cũ của sản phẩm đó trước khi lưu bộ mới
    // Để tránh việc trùng lặp hoặc dư thừa dữ liệu khi Admin cập nhật
    attributeRepo.deleteAllByProductId(productId);

    // Gán lại Product ID cho từng attribute trước khi saveAll
    // (Vì khi nhận từ JSON, field product bên trong attribute thường bị null)
    attributeRepo.saveAll(attributes);
  }

  @Override
  @Transactional
  public void deleteByProductId(Integer productId) {
    attributeRepo.deleteAllByProductId(productId);
  }
}
