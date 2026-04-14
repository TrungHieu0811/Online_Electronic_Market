package fpt.demo.repository;

import fpt.demo.entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductImageRepository extends JpaRepository<ProductImage, Integer> {

  // Lấy danh sách ảnh của sản phẩm, sắp xếp theo thứ tự hiển thị (displayOrder)
  // Ảnh có displayOrder = 0 thường là ảnh đại diện
  //  List<ProductImage> findByProductIdOrderByDisplayOrderAsc(Integer productId);
  @Query("SELECT i FROM ProductImage i WHERE i.product.id = :productId ORDER BY i.displayOrder ASC")
  List<ProductImage> findAllByProductId(@Param("productId") Integer productId);

  // Xóa album ảnh khi xóa sản phẩm
  @Modifying
  @Transactional
  @Query("DELETE FROM ProductImage pi WHERE pi.product.id = :productId")
  void deleteByProductId(@Param("productId") Integer productId);

  // Lấy ảnh đầu tiên làm ảnh đại diện (Thumbnail) cho danh sách sản phẩm
//  @Query(value = "SELECT TOP 1 * FROM product_images WHERE product_id = :productId ORDER BY display_order ASC", nativeQuery = true)
//  ProductImage findThumbnail(@Param("productId") Integer productId);
  Optional<ProductImage> findFirstByProductIdOrderByDisplayOrderAsc(Integer productId);
  
  // Trong ProductImageRepository.java
@Query("SELECT COALESCE(MAX(pi.displayOrder), -1) FROM ProductImage pi WHERE pi.product.id = :productId")
Integer findMaxDisplayOrderByProductId(@Param("productId") Integer productId);
}
