/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Interface.java to edit this template
 */
package fpt.demo.repository;

import fpt.demo.entity.Category;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Integer> {

  // 1. Lấy danh mục gốc (Parent is NULL)
  @Query("SELECT c FROM Category c WHERE c.parent IS NULL AND c.status = true")
  List<Category> findRootCategories();

  // 2. Lấy danh mục con theo ID cha
  @Query("SELECT c FROM Category c WHERE c.parent.id = :parentId AND c.status = true")
  List<Category> findChildrenByParentId(@Param("parentId") Integer parentId);

  // 3. Tìm theo slug
  @Query("SELECT c FROM Category c WHERE c.slug = :slug")
  Optional<Category> findBySlug(@Param("slug") String slug);

  // 4. Lấy danh mục hoạt động, sắp xếp A-Z
  @Query("SELECT c FROM Category c WHERE c.status = true ORDER BY c.name ASC")
  List<Category> findAllActiveSorted();

  // 5. Lấy danh mục theo Brand ID (Giả sử có quan hệ hoặc bảng trung gian)
  // Lưu ý: Nếu là quan hệ n-n, bạn cần JOIN thêm bảng brands
//  @Query("SELECT c FROM Category c JOIN c.brands b WHERE b.id = :brandId AND c.status = true")
  @Query("SELECT DISTINCT cg from ProductGroup pg JOIN pg.category cg WHERE pg.brand.id = :brandId")
  List<Category> findByBrandId(@Param("brandId") Integer brandId);

  // 6. Lấy toàn bộ kèm theo thông tin cha (Dùng JOIN FETCH để tránh lỗi N+1)
  @Query("SELECT c FROM Category c LEFT JOIN FETCH c.parent WHERE c.status = true")
  List<Category> findAllActiveWithParent();

  // 7. Thay đổi trạng thái (Toggle status)
  @Modifying
  @Transactional
  @Query("UPDATE Category c SET c.status = CASE WHEN c.status = true THEN false ELSE true END, "
          + "c.updatedAt = CURRENT_TIMESTAMP WHERE c.id = :id")
  int changeStatus(@Param("id") Integer id);
}
