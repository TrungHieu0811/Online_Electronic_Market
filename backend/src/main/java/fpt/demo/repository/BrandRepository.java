package fpt.demo.repository;

import fpt.demo.entity.Brand;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface BrandRepository extends JpaRepository<Brand, Integer> {

  // get active list
  List<Brand> findByStatusTrue();

  // get by slug
  Optional<Brand> findBySlug(String slug);

  // find by name (ignore case sen)
  @Query("SELECT b FROM Brand b WHERE LOWER(b.name) LIKE LOWER(CONCAT('%', :name, '%')) ORDER BY b.name ASC")
  List<Brand> searchByName(@Param("name") String name);

  // change Brand status
  @Modifying
  @Transactional
  @Query("UPDATE Brand p SET p.status = CASE WHEN p.status = true THEN false ELSE true END, p.updatedAt = CURRENT_TIMESTAMP WHERE p.id = :id")
  int changeStatus(@Param("id") Integer id);
}
