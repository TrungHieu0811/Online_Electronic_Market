package fpt.demo.repository;

import fpt.demo.entity.CategoryFilterConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CategoryFilterConfigRepository extends JpaRepository<CategoryFilterConfig, Integer> {

  Optional<CategoryFilterConfig> findByCategorySlug(String slug);
}
