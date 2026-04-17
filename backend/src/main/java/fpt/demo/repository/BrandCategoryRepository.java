package fpt.demo.repository;

import fpt.demo.entity.Brand;
import fpt.demo.entity.BrandCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface BrandCategoryRepository extends JpaRepository<BrandCategory, Integer> {

  @Query("SELECT bc.brand FROM BrandCategory bc WHERE bc.category.slug = :slug")
  List<Brand> findBrandsByCategorySlug(String slug);

  @Query("SELECT bc.category.id FROM BrandCategory bc WHERE bc.brand.id = :brandId")
  List<Integer> findCategoryIdsByBrandId(@Param("brandId") Integer brandId);

  @Query("SELECT bc.brand.id FROM BrandCategory bc WHERE bc.category.id = :categoryId")
  List<Integer> findBrandIdsByCategoryId(@Param("categoryId") Integer categoryId);

  @Modifying
  @Transactional
  @Query("DELETE FROM BrandCategory bc WHERE bc.category.id = :categoryId")
  void deleteByCategoryId(Integer categoryId);

  @Modifying
  @Transactional
  @Query("DELETE FROM BrandCategory bc WHERE bc.brand.id = :brandId")
  void deleteByBrandId(Integer brandId);
}
