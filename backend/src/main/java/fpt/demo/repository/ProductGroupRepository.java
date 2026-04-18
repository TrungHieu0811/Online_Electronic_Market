package fpt.demo.repository;

import fpt.demo.dto.ProductGroupSummaryDTO;
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

  @Query("SELECT pg FROM ProductGroup pg")
  Page<ProductGroup> findAll(Pageable pageable);

  // 1. Get all active product groups (status = true)
  @Query("SELECT pg FROM ProductGroup pg WHERE pg.status = true")
  Page<ProductGroup> findAllActive(Pageable pageable);

  // 2. Filter product groups by Category ID (e.g., Electronics)
  @Query("SELECT pg FROM ProductGroup pg WHERE pg.category.id = :categoryId AND pg.status = true")
  Page<ProductGroup> findByCategoryId(@Param("categoryId") Integer categoryId, Pageable pageable);

  // 3. Filter product groups by Brand ID (e.g., Sony)
  @Query("SELECT pg FROM ProductGroup pg WHERE pg.brand.id = :brandId AND pg.status = true")
  Page<ProductGroup> findByBrandId(@Param("brandId") Integer brandId, Pageable pageable);

  // 4. Search product groups by name (Used for Admin management)
  @Query("SELECT pg FROM ProductGroup pg WHERE LOWER(pg.name) LIKE LOWER(CONCAT('%', :name, '%'))")
  Page<ProductGroup> searchByName(@Param("name") String name, Pageable pageable);

  // ── Mới thêm: summary cho trang Admin list ────────────────────────────────
  // Dùng native query để có subquery lấy thumbnailUrl
//  @Query(value = """
//            SELECT
//                pg.id                                                    AS groupId,
//                pg.name                                                  AS groupName,
//                b.name                                                   AS brandName,
//                c.name                                                   AS categoryName,
//                COUNT(p.id)                                              AS variantCount,
//                MIN(COALESCE(p.sale_price, p.base_price))               AS minPrice,
//                (
//                    SELECT TOP 1 pi.image_url 
//                    FROM product_images pi
//                    JOIN products pr ON pr.id = pi.product_id
//                    WHERE pr.product_group_id = pg.id
//                    ORDER BY pr.id ASC, pi.id ASC
//                ) AS thumbnailUrl,
//                CAST(MAX(CASE WHEN p.is_featured = 1 THEN 1 ELSE 0 END) AS BIT)
//                                                                         AS hasFeatured
//            FROM product_groups pg
//            LEFT JOIN brands b        ON b.id  = pg.brand_id
//            LEFT JOIN categories c    ON c.id  = pg.category_id
//            LEFT JOIN products p      ON p.product_group_id = pg.id
//            WHERE (:search   IS NULL OR LOWER(pg.name) LIKE LOWER(CONCAT('%', :search, '%')))
//              AND (:brandId   IS NULL OR pg.brand_id    = :brandId)
//              AND (:categoryId IS NULL OR pg.category_id = :categoryId)
//            GROUP BY pg.id, pg.name, b.name, c.name
//            """,
//          countQuery = """
//            SELECT COUNT(DISTINCT pg.id)
//            FROM product_groups pg
//            LEFT JOIN brands b     ON b.id  = pg.brand_id
//            LEFT JOIN categories c ON c.id  = pg.category_id
//            WHERE (:search    IS NULL OR LOWER(pg.name) LIKE LOWER(CONCAT('%', :search, '%')))
//              AND (:brandId   IS NULL OR pg.brand_id    = :brandId)
//              AND (:categoryId IS NULL OR pg.category_id = :categoryId)
//            """,
//          nativeQuery = true)
//  Page<ProductGroupSummaryDTO> findGroupSummaries(
//          @Param("search") String search,
//          @Param("brandId") Integer brandId,
//          @Param("categoryId") Integer categoryId,
//          Pageable pageable);
  @Query(value = """
    SELECT
        pg.id                                                    AS groupId,
        pg.name                                                  AS groupName,
        pg.status                                                AS status,         
        b.name                                                   AS brandName,
        c.name                                                   AS categoryName,
        COUNT(p.id)                                              AS variantCount,
        MIN(COALESCE(p.sale_price, p.base_price))               AS minPrice,
        (
            SELECT TOP 1 pi.image_url 
            FROM product_images pi
            JOIN products pr ON pr.id = pi.product_id
            WHERE pr.group_id = pg.id
            ORDER BY pr.id ASC, pi.id ASC
        ) AS thumbnailUrl,
        CAST(MAX(CASE WHEN p.is_featured = 1 THEN 1 ELSE 0 END) AS BIT)
                                                                 AS hasFeatured
    FROM product_groups pg
    LEFT JOIN brands b        ON b.id  = pg.brand_id
    LEFT JOIN categories c    ON c.id  = pg.category_id
    LEFT JOIN products p      ON p.group_id = pg.id
    WHERE (:search   IS NULL OR LOWER(pg.name) LIKE LOWER(CONCAT('%', :search, '%')))
      AND (:brandId   IS NULL OR pg.brand_id    = :brandId)
      AND (:categoryId IS NULL OR pg.category_id = :categoryId)
    GROUP BY pg.id, pg.name, pg.status, b.name, c.name
    """, // ĐÃ XÓA DÒNG ORDER BY TẠI ĐÂY
          countQuery = """
    SELECT COUNT(DISTINCT pg.id)
    FROM product_groups pg
    WHERE (:search    IS NULL OR LOWER(pg.name) LIKE LOWER(CONCAT('%', :search, '%')))
      AND (:brandId   IS NULL OR pg.brand_id    = :brandId)
      AND (:categoryId IS NULL OR pg.category_id = :categoryId)
    """,
          nativeQuery = true)
  Page<ProductGroupSummaryDTO> findGroupSummaries(
          @Param("search") String search,
          @Param("brandId") Integer brandId,
          @Param("categoryId") Integer categoryId,
          Pageable pageable);
}
