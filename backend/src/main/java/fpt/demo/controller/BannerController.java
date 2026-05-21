package fpt.demo.controller;

import fpt.demo.entity.Banner;
import fpt.demo.repository.BannerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/public") // Đặt là public để ai vào web cũng xem được không cần token
@RequiredArgsConstructor
public class BannerController {

    private final BannerRepository bannerRepository;

    // API này sẽ có đường dẫn đầy đủ là: GET http://localhost:8080/api/public/banners
    @GetMapping("/banners")
    public ResponseEntity<List<Banner>> getActiveBanners() {
        List<Banner> activeBanners = bannerRepository.findByIsActiveTrue();
        return ResponseEntity.ok(activeBanners);
    }
}