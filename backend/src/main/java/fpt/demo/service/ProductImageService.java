package fpt.demo.service;

import fpt.demo.entity.ProductImage;
import java.util.List;

public interface ProductImageService {

  List<ProductImage> getByProductId(Integer productId);

  ProductImage save(ProductImage image);

  void deleteByProductId(Integer productId);

  void deleteById(Integer id);

  List<ProductImage> findAllImagesByProductIdsList(List<Integer> productIds);
  
  ProductImage getThumbImage(Integer productId);
}
