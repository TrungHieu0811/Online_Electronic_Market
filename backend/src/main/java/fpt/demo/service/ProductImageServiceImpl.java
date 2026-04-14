package fpt.demo.service;

import fpt.demo.entity.ProductImage;
import fpt.demo.repository.ProductImageRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProductImageServiceImpl implements ProductImageService {

  private final ProductImageRepository imageRepo;

  @Override
  public List<ProductImage> getByProductId(Integer productId) {
    return imageRepo.findAllByProductId(productId);
  }

  @Override
  @Transactional
  public ProductImage save(ProductImage image) {
    return imageRepo.save(image);
  }

  @Override
  @Transactional
  public void deleteByProductId(Integer productId) {
    imageRepo.deleteByProductId(productId);
  }

  @Override
  @Transactional
  public void deleteById(Integer id) {
    imageRepo.deleteById(id);
  }
}
