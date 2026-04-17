package fpt.demo.repository;

import fpt.demo.entity.ProductAttribute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Repository
public interface ProductAttributeRepository extends JpaRepository<ProductAttribute, Integer> {

//   Get all technical specifications for a specific product. Essential for the
//   Product Details page.
  @Query("SELECT pa FROM ProductAttribute pa WHERE pa.product.id = :productId")
  List<ProductAttribute> findAllByProductId(@Param("productId") Integer productId);

  @Query("SELECT pa FROM ProductAttribute pa WHERE pa.product.id IN :productIds ")
  List<ProductAttribute> findAllByProductIdsList(@Param("productIds") List<Integer> productIds);

//    Delete all attributes associated with a specific product. Used when
//    updating or removing a product from the system.
  @Modifying
  @Transactional
  @Query("DELETE FROM ProductAttribute pa WHERE pa.product.id = :productId")
  void deleteAllByProductId(@Param("productId") Integer productId);
}
