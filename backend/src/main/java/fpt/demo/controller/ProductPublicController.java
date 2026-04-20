package fpt.demo.controller;

import fpt.demo.dto.BrandResponseDto;
import fpt.demo.dto.CategoryResponseDto;
import fpt.demo.dto.ProductAttributeResponseDto;
import fpt.demo.dto.ProductBasicInfoDto;
import fpt.demo.dto.ProductDetailsResponseDto;
import fpt.demo.dto.ProductFilterRequestDto;
import fpt.demo.dto.ProductGroupResponseDto;
import fpt.demo.dto.ProductImageSummaryDto;
import fpt.demo.dto.ProductSummaryResponseDto;
import fpt.demo.entity.Brand;
import fpt.demo.entity.Category;
import fpt.demo.entity.Product;
import fpt.demo.entity.ProductAttribute;
import fpt.demo.entity.ProductGroup;
import fpt.demo.entity.ProductImage;
import fpt.demo.repository.ProductAttributeRepository;
import fpt.demo.repository.ProductRepository;
import fpt.demo.service.ProductImageService;
import fpt.demo.specification.ProductSpecification;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/products")
@RequiredArgsConstructor

public class ProductPublicController {

    private final ProductRepository productRepository;
    private final ProductAttributeRepository productAttributeRepository;
    private final ProductImageService productImageService;

    // 1. Trang danh sách có lọc động (Dùng ProductFilterRequestDto bạn đã có)
    @GetMapping
    public ResponseEntity<?> getAllProducts(
            ProductFilterRequestDto filter,
            @RequestParam Map<String, String> allParams,
            Pageable pageable,
            Authentication auth) {
        // Chuyển filter sang Specification
        Map<String, List<String>> attributes = new HashMap<>();
        allParams.forEach((key, value) -> {
            if (key.startsWith("attributes.")) {
                String attrName = key.replace("attributes.", "");
                attributes.put(attrName, Arrays.asList(value.split(",")));
            }
        });
        filter.setAttributes(attributes);

        boolean isAdmin = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPERADMIN")
                || a.getAuthority().equals("ROLE_STAFF"));

        Specification<Product> spec = ProductSpecification.getSpecFromRequest(filter, isAdmin);
        // return ResponseEntity.ok(productRepository.findAll(spec, pageable));

        Page<Product> productPage = productRepository.findAll(spec, pageable);
        //Thu thập tất cả Product ID của trang hiện tại
        List<Integer> productIds = productPage.getContent().stream()
                .map(Product::getId)
                .collect(Collectors.toList());

        //Truy vấn 1 lần duy nhất để lấy danh sách ảnh
        Map<Integer, List<ProductImage>> imagesGroupedByProductId = productImageService
                .findAllImagesByProductIdsList(productIds)
                .stream()
                .collect(Collectors.groupingBy(img -> img.getProduct().getId()));

        // 4. Map sang DTO và xử lý ẩn trường
        Page<ProductDetailsResponseDto> dtoPage = productPage.map(p -> {
            List<ProductImage> entityImages = imagesGroupedByProductId.getOrDefault(p.getId(), Collections.emptyList());

            List<ProductImageSummaryDto> imageDtos = entityImages.stream()
                    .map(this::mapToImageSummaryDto)
                    .collect(Collectors.toList());
            // Lưu ý: Nếu trang list không cần attribute, bạn có thể truyền null vào tham số thứ 2
            ProductDetailsResponseDto dto = mapToDetailsDto(p, null);
            dto.setImageList(imageDtos);

            if (!isAdmin) {
                dto.setImportPrice(null);
//        dto.setCreatedAt(null);
                dto.setUpdatedAt(null);
                // Bạn có thể chặn luôn khách xem sản phẩm HIDDEN tại đây nếu muốn
            }
            return dto;
        });

        return ResponseEntity.ok(dtoPage);
    }

    // 2. Trang chi tiết sản phẩm theo Slug
    @GetMapping("/{slug}")
    public ResponseEntity<?> getProductDetail(@PathVariable String slug, Authentication auth) {
        // BƯỚC 1: Tìm Product
        Product p = productRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Sản phẩm không tồn tại"));

        // BƯỚC 2: Logic nghiệp vụ & Lấy Attributes
        productRepository.incrementViewCount(p.getId());
//    List<ProductAttribute> attributes = productAttributeRepository.findAllByProductId(p.getId());
        List<ProductImage> entityImages = productImageService.getByProductId(p.getId());
        List<ProductImageSummaryDto> imageDtos = entityImages.stream()
                .map(this::mapToImageSummaryDto) // Sử dụng hàm map đã tách riêng
                .collect(Collectors.toList());

        ProductDetailsResponseDto dto = mapToDetailsDto(p, p.getAttributes());
        dto.setImageList(imageDtos);
        // BƯỚC 3: Kiểm tra Role và Map
        boolean isAdmin = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPERADMIN")
                || a.getAuthority().equals("ROLE_STAFF"));

        if (!isAdmin) {
            dto.setImportPrice(null);
//      dto.setCreatedAt(null);
            dto.setUpdatedAt(null);
        }
        return ResponseEntity.ok(dto);
    }

    // 3. Lấy sản phẩm nổi bật cho trang chủ
    @GetMapping("/featured")
    public ResponseEntity<?> getFeatured(Authentication auth) {
        List<Product> products = productRepository.findByIsFeaturedTrueAndStatus("ACTIVE");
        List<Integer> productIds = products.stream()
                .map(Product::getId)
                .collect(Collectors.toList());

        //Truy vấn 1 lần duy nhất để lấy danh sách images
        Map<Integer, List<ProductImage>> imagesGroupedByProductId = productImageService
                .findAllImagesByProductIdsList(productIds)
                .stream()
                .collect(Collectors.groupingBy(img -> img.getProduct().getId()));

        // Chuyển toàn bộ sang DTO rút gọn
        List<ProductDetailsResponseDto> dtos = products.stream()
                .map(p -> {
                    // 1. Map các trường cơ bản sang DTO
                    ProductDetailsResponseDto dto = mapToDetailsDto(p, null);

                    List<ProductImage> entityImages = imagesGroupedByProductId.getOrDefault(p.getId(), Collections.emptyList());

                    // 2. Chuyển Entity sang DTO rút gọn
                    List<ProductImageSummaryDto> imageDtos = entityImages.stream()
                            .map(this::mapToImageSummaryDto) // Gọi hàm map đã tách riêng
                            .collect(Collectors.toList());

                    // 3. Gán vào DTO
                    dto.setImageList(imageDtos);
                    boolean isAdmin = auth != null && auth.getAuthorities().stream()
                            .anyMatch(a -> a.getAuthority().equals("ROLE_SUPERADMIN")
                            || a.getAuthority().equals("ROLE_STAFF"));

                    if (!isAdmin) {
                        dto.setImportPrice(null);
//                dto.setCreatedAt(null);
                        dto.setUpdatedAt(null);
                    }
                    return dto;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}/related")
    public ResponseEntity<?> getRelatedProducts(@PathVariable Integer id, Authentication auth) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sản phẩm không tồn tại"));

        // Lấy sản phẩm cùng nhóm
        List<Product> related = productRepository.findRelatedByGroup(
                product.getGroup().getId(), id, PageRequest.of(0, 4));

        // Nếu thiếu, lấy thêm cùng danh mục
//    if (related.size() < 4) {
//      List<Product> extra = productRepository.findRelatedByCategory(
//              product.getGroup().getCategory().getId(), id, PageRequest.of(0, 4 - related.size()));
//      related.addAll(extra);
//    }
        //Thu thập tất cả Product ID của trang hiện tại
        List<Integer> productIds = related.stream()
                .map(Product::getId)
                .collect(Collectors.toList());

        //Truy vấn 1 lần duy nhất để lấy danh sách images
        Map<Integer, List<ProductImage>> imagesGroupedByProductId = productImageService
                .findAllImagesByProductIdsList(productIds)
                .stream()
                .collect(Collectors.groupingBy(img -> img.getProduct().getId()));

        // Chuyển toàn bộ sang DTO rút gọn
        List<ProductDetailsResponseDto> dtos = related.stream()
                .map(p -> {
                    // 1. Map các trường cơ bản sang DTO
//              ProductSummaryResponseDto dto = this.mapToSummaryDto(p);
                    ProductDetailsResponseDto dto = mapToDetailsDto(p, null);

                    List<ProductImage> entityImages = imagesGroupedByProductId.getOrDefault(p.getId(), Collections.emptyList());

                    // 2. Chuyển Entity sang DTO rút gọn
                    List<ProductImageSummaryDto> imageDtos = entityImages.stream()
                            .map(this::mapToImageSummaryDto) // Gọi hàm map đã tách riêng
                            .collect(Collectors.toList());

                    // 3. Gán vào DTO
                    dto.setImageList(imageDtos);

                    boolean isAdmin = auth != null && auth.getAuthorities().stream()
                            .anyMatch(a -> a.getAuthority().equals("ROLE_SUPERADMIN")
                            || a.getAuthority().equals("ROLE_STAFF"));

                    if (!isAdmin) {
                        dto.setImportPrice(null);
//                dto.setCreatedAt(null);
                        dto.setUpdatedAt(null);
                    }
                    return dto;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/group/{id}")
    public ResponseEntity<?> getProductsByGroupId(
            @PathVariable Integer id,
            Pageable pageable,
            Authentication auth) {
        boolean isAdmin = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPERADMIN")
                || a.getAuthority().equals("ROLE_STAFF"));

        Page<Product> productPage = productRepository.findByGroup(id, pageable);
        List<Integer> productIds = productPage.getContent().stream()
                .map(Product::getId)
                .collect(Collectors.toList());

        //Truy vấn 1 lần duy nhất để lấy danh sách ảnh
        Map<Integer, List<ProductImage>> imagesGroupedByProductId = productImageService
                .findAllImagesByProductIdsList(productIds)
                .stream()
                .collect(Collectors.groupingBy(img -> img.getProduct().getId()));

        Page<ProductDetailsResponseDto> dtoPage = productPage.map(p -> {
            List<ProductImage> entityImages = imagesGroupedByProductId.getOrDefault(p.getId(), Collections.emptyList());

            List<ProductImageSummaryDto> imageDtos = entityImages.stream()
                    .map(this::mapToImageSummaryDto)
                    .collect(Collectors.toList());
            // Lưu ý: Nếu trang list không cần attribute, bạn có thể truyền null vào tham số thứ 2
            ProductDetailsResponseDto dto = mapToDetailsDto(p, null);
            dto.setImageList(imageDtos);

            if (!isAdmin) {
                dto.setImportPrice(null);
//        dto.setCreatedAt(null);
                dto.setUpdatedAt(null);
                // Bạn có thể chặn luôn khách xem sản phẩm HIDDEN tại đây nếu muốn
            }
            return dto;
        });

        return ResponseEntity.ok(dtoPage);
    }

    @GetMapping("/{id}/getthumbnail")
    public ResponseEntity<?> getProductThumbnailById(@PathVariable Integer id) {
        return ResponseEntity.ok(productImageService.getThumbImage(id));
    }

    // ==========================
    //  HELPER MAPPER
    private BrandResponseDto mapBrand(Product p) {
        if (p.getGroup() == null || p.getGroup().getBrand() == null) {
            return null;
        }
        Brand b = p.getGroup().getBrand();
        BrandResponseDto dto = new BrandResponseDto();
        dto.setId(b.getId());
        dto.setName(b.getName());
        dto.setSlug(b.getSlug());
        dto.setLogoUrl(b.getLogoUrl());
        return dto;
    }

// Map Category chung
    private CategoryResponseDto mapCategory(Product p) {
        if (p.getGroup() == null || p.getGroup().getCategory() == null) {
            return null;
        }
        Category c = p.getGroup().getCategory();
        CategoryResponseDto dto = new CategoryResponseDto();
        dto.setId(c.getId());
        dto.setName(c.getName());
        dto.setSlug(c.getSlug());
        dto.setStatus(c.getStatus());
        dto.setParentId(c.getParent() != null ? c.getParent().getId() : null);
        dto.setParentSlug(c.getParent() != null ? c.getParent().getSlug() : null);
        return dto;
    }

    // map ProductGroup
    private ProductGroupResponseDto mapGroup(Product p) {
        if (p.getGroup() == null) {
            return null;
        }
        ProductGroup pg = p.getGroup();
        ProductGroupResponseDto dto = new ProductGroupResponseDto();
        dto.setId(pg.getId());
        dto.setName(pg.getName());
        dto.setBrandId(pg.getBrand().getId());
        dto.setCategoryId(pg.getCategory().getId());
        dto.setStatus(pg.getStatus());

        return dto;
    }

// Map Attributes chung
    private List<ProductAttributeResponseDto> mapAttributes(List<ProductAttribute> attributes) {
        if (attributes == null) {
            return new ArrayList<>();
        }
        return attributes.stream().map(attr -> {
            ProductAttributeResponseDto dto = new ProductAttributeResponseDto();
            dto.setName(attr.getName());
            dto.setAttrValue(attr.getAttrValue());
            return dto;
        }).collect(Collectors.toList());
    }

    private ProductDetailsResponseDto mapToDetailsDto(Product p, List<ProductAttribute> attrs) {
        ProductDetailsResponseDto dto = new ProductDetailsResponseDto();
        // Copy phần cơ bản giống Public
        dto.setId(p.getId());
        dto.setVariantName(p.getVariantName());
        dto.setSlug(p.getSlug());
        dto.setSummary(p.getSummary());
        dto.setDescription(p.getDescription());
        dto.setBasePrice(p.getBasePrice());
        dto.setSalePrice(p.getSalePrice());
        dto.setWarrantyMonths(p.getWarrantyMonths());
        dto.setAverageRating(p.getAverageRating());
        dto.setViewCount(p.getViewCount());
        dto.setStockQuantity(p.getStockQuantity());
        dto.setStatus(p.getStatus());
        dto.setIsFeatured(p.getIsFeatured());

        // Các trường chỉ Admin có
        dto.setImportPrice(p.getImportPrice());
        dto.setCreatedAt(p.getCreatedAt());
        dto.setUpdatedAt(p.getUpdatedAt());

        dto.setProductGroup(mapGroup(p));
        dto.setBrand(mapBrand(p));
        dto.setCategory(mapCategory(p));
        dto.setAttributes(mapAttributes(attrs));
        return dto;
    }

    private ProductSummaryResponseDto mapToSummaryDto(Product p) {
        ProductSummaryResponseDto dto = new ProductSummaryResponseDto();
        dto.setId(p.getId());
        dto.setVariantName(p.getVariantName());
        dto.setSlug(p.getSlug());
        dto.setSummary(p.getSummary());
        dto.setDescription(p.getDescription());
        dto.setBasePrice(p.getBasePrice());
        dto.setSalePrice(p.getSalePrice());
        dto.setStockQuantity(p.getStockQuantity());
        dto.setStatus(p.getStatus());
        dto.setWarrantyMonths(p.getWarrantyMonths());
        dto.setIsFeatured(p.getIsFeatured());
        dto.setViewCount(p.getViewCount());
        dto.setAverageRating(p.getAverageRating());

        // Chỉ map những thông tin cơ bản của Brand/Category nếu cần hiện trên Card
        dto.setBrand(mapBrand(p));
        dto.setCategory(mapCategory(p));

        return dto;
    }

    private ProductImageSummaryDto mapToImageSummaryDto(ProductImage img) {
        if (img == null) {
            return null;
        }
        ProductImageSummaryDto dto = new ProductImageSummaryDto();
        dto.setId(img.getId());
        dto.setImageUrl(img.getImageUrl());
        dto.setDisplayOrder(img.getDisplayOrder());
        return dto;
    }

    @GetMapping("/{id}/basic-info")
    public ResponseEntity<ProductBasicInfoDto> getBasicProductInfo(@PathVariable Integer id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        ProductBasicInfoDto dto = new ProductBasicInfoDto();
        dto.setId(product.getId());
        dto.setVariantName(product.getVariantName());
        dto.setSlug(product.getSlug());

        return ResponseEntity.ok(dto);
    }
}
