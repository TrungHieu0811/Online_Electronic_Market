package fpt.demo.service;

import fpt.demo.entity.ProductAttribute;
import java.util.List;

public interface ProductAttributeService {

  List<ProductAttribute> getByProductId(Integer productId);

  void saveAll(List<ProductAttribute> attributes, Integer productId);

  void deleteByProductId(Integer productId);
  
  List<ProductAttribute> findAllByProductIdsList(List<Integer> productIds);
}
