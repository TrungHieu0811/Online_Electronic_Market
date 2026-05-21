package fpt.demo.repository;

import fpt.demo.entity.Banner; // Nhớ import đúng đường dẫn Entity của bạn
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BannerRepository extends JpaRepository<Banner, Integer> {
    // Spring Data JPA sẽ tự động dịch câu này thành: 
    // SELECT * FROM banners WHERE is_active = true
    List<Banner> findByIsActiveTrue(); 
}