package fpt.demo.repository;

import fpt.demo.entity.Product;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Integer>, JpaSpecificationExecutor<Product> {

  // find products by variantName
  @Query("SELECT p FROM Product p JOIN FETCH p.group WHERE LOWER(p.variantName) LIKE LOWER(CONCAT('%', :name,'%'))")
  Page<Product> findByVariantName(@Param("name") String name, Pageable pageable);

  // find products by groupId
  @Query("SELECT p FROM Product p WHERE p.group.id = :groupId")
  Page<Product> findByGroup(@Param("groupId") Integer groupId, Pageable pageable);

  // find product by Slug
  @EntityGraph(attributePaths = {"group", "group.category", "group.brand"})
  Optional<Product> findBySlug(String slug);

  // find feature products
  List<Product> findByIsFeaturedTrueAndStatus(String status);

  // update stock after successfully order
  @Modifying
  @Transactional
  @Query("UPDATE Product p SET p.stockQuantity = p.stockQuantity - :quantity "
          + "WHERE p.id = :id AND p.stockQuantity >= :quantity")
  int decreaseStock(@Param("id") Integer id, @Param("quantity") Integer quantity);

  // increase view count
  @Modifying
  @Transactional
  @Query("UPDATE Product p SET p.viewCount = p.viewCount + 1 WHERE p.id = :id")
  void incrementViewCount(@Param("id") Integer id);

  // get top 10 newest products
  List<Product> findTop10ByOrderByCreatedAtDesc();

  // change product status
  @Modifying
  @Transactional
  @Query("UPDATE Product p SET p.status = :status, p.updatedAt = CURRENT_TIMESTAMP WHERE p.id = :id")
  int updateStatus(@Param("id") Integer id, @Param("status") String status);

  // change isFeatured
  @Modifying
  @Transactional
  @Query("UPDATE Product p SET p.isFeatured = CASE WHEN p.isFeatured = true THEN false ELSE true END, p.updatedAt = CURRENT_TIMESTAMP WHERE p.id = :id")
  int toggleIsFeatured(@Param("id") Integer id);

//  // find relate products
//  @Query("SELECT p FROM Product p WHERE p.group.id = :groupId AND p.id <> :currentProductId AND p.status = 'ACTIVE'")
//  List<Product> findRelatedProducts(@Param("groupId") Integer groupId, @Param("currentProductId") Integer currentProductId);
  // Lấy các sản phẩm cùng nhóm nhưng khác sản phẩm hiện tại
  @Query("SELECT p FROM Product p WHERE p.group.id = :groupId AND p.status = 'ACTIVE'")
//  @Query("SELECT p FROM Product p WHERE p.group.id = :groupId AND p.id <> :currentId AND p.status = 'ACTIVE'")
  List<Product> findRelatedByGroup(@Param("groupId") Integer groupId, @Param("currentId") Integer currentId, Pageable pageable);

// Nếu nhóm không có đủ, lấy các sản phẩm cùng danh mục
  @Query("SELECT p FROM Product p WHERE p.group.category.id = :categoryId AND p.id <> :currentId AND p.status = 'ACTIVE'")
  List<Product> findRelatedByCategory(@Param("categoryId") Integer categoryId, @Param("currentId") Integer currentId, Pageable pageable);

  long countByStatus(String status);

  long countByStockQuantityLessThan(Integer threshold);

  long countByIsFeaturedTrue();
  

}
