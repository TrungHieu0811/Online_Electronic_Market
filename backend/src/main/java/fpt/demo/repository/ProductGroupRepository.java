package fpt.demo.repository;

import fpt.demo.entity.ProductGroup;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface ProductGroupRepository extends JpaRepository<ProductGroup, Integer> {

  // 1. Get all active product groups (status = true)
  @Query("SELECT pg FROM ProductGroup pg WHERE pg.status = true")
  List<ProductGroup> findAllActive();

  // 2. Filter product groups by Category ID (e.g., Electronics)
  @Query("SELECT pg FROM ProductGroup pg WHERE pg.category.id = :categoryId AND pg.status = true")
  List<ProductGroup> findByCategoryId(@Param("categoryId") Integer categoryId);

  // 3. Filter product groups by Brand ID (e.g., Sony)
  @Query("SELECT pg FROM ProductGroup pg WHERE pg.brand.id = :brandId AND pg.status = true")
  List<ProductGroup> findByBrandId(@Param("brandId") Integer brandId);

  // 4. Search product groups by name (Used for Admin management)
  @Query("SELECT pg FROM ProductGroup pg WHERE LOWER(pg.name) LIKE LOWER(CONCAT('%', :name, '%'))")
  Page<ProductGroup> searchByName(@Param("name") String name, Pageable pageable);

}
