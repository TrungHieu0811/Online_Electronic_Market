package fpt.demo.controller;

import fpt.demo.entity.Brand;
import fpt.demo.service.BrandService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/brands")
@RequiredArgsConstructor
public class BrandPublicController {

  private final BrandService brandService;

  @GetMapping
  public ResponseEntity<List<Brand>> findAll() {
    return ResponseEntity.ok(brandService.findAll());
  }
}
