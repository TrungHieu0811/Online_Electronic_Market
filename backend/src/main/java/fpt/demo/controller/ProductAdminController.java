package fpt.demo.controller;

import fpt.demo.dto.ProductSaveDto;
import fpt.demo.entity.Product;
import fpt.demo.entity.ProductAttribute;
import fpt.demo.entity.ProductGroup;
import fpt.demo.entity.ProductImage;
import fpt.demo.repository.ProductAttributeRepository;
import fpt.demo.repository.ProductGroupRepository;
import fpt.demo.repository.ProductImageRepository;
import fpt.demo.repository.ProductRepository;
import fpt.demo.service.FileStorageService;
import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.WebDataBinder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.InitBinder;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin/products")
@RequiredArgsConstructor
public class ProductAdminController {

  private final ProductRepository productRepository;
  private final ProductGroupRepository productGroupRepository;
  private final FileStorageService fileStorageService;
  private final ProductImageRepository productImageRepository;
  private final ProductAttributeRepository productAttributeRepository;

  @InitBinder
  public void initBinder(WebDataBinder binder) {
    // Tăng giới hạn số lượng phần tử trong mảng/list khi binding (mặc định là 256)
    binder.setAutoGrowCollectionLimit(1000);
  }

  // 1. Thêm mới sản phẩm (Dùng ProductCreateDto)
  @PostMapping(consumes = {MediaType.MULTIPART_FORM_DATA_VALUE})
  @Transactional
  public ResponseEntity<?> createProduct(
          @RequestPart("product") @Valid ProductSaveDto dto,
          @RequestPart(value = "imageFiles", required = false) List<MultipartFile> imageFiles
  ) {
    // Logic mapping DTO -> Entity và save
    // 2. Map DTO -> Product Entity
    Product product = new Product();
    ProductGroup group = productGroupRepository.findById(dto.getGroupId()).orElseThrow(() -> new RuntimeException("Không tìm thấy nhóm sản phẩm với ID: " + dto.getGroupId()));
    product.setGroup(group);
    product.setVariantName(dto.getVariantName());
    product.setSlug(dto.getSlug());
    product.setSummary(dto.getSummary());
    product.setDescription(dto.getDescription());
    product.setImportPrice(dto.getImportPrice());
    product.setBasePrice(dto.getBasePrice());
    product.setSalePrice(dto.getSalePrice());
    product.setStockQuantity(dto.getStockQuantity());
    product.setWarrantyMonths(dto.getWarrantyMonths());
    product.setIsFeatured(dto.getIsFeatured() != null ? dto.getIsFeatured() : false);
//    product.setIsFeatured(dto.getIsFeatured());
    product.setStatus(dto.getStatus() != null ? dto.getStatus() : "ACTIVE");
//    Product savedProduct = productRepository.save(product);

    if (dto.getAttributes() != null && !dto.getAttributes().isEmpty()) {
      for (var attrDto : dto.getAttributes()) {
        ProductAttribute attr = new ProductAttribute();
        attr.setName(attrDto.getName());
        attr.setAttrValue(attrDto.getAttrValue());
        attr.setProduct(product);
        product.getAttributes().add(attr);
      }
    }

    Product savedProduct = productRepository.save(product);

    if (imageFiles != null && !imageFiles.isEmpty()) {
      for (int i = 0; i < imageFiles.size(); i++) {
        MultipartFile file = imageFiles.get(i);
        if (file != null && !file.isEmpty()) {
          String path = fileStorageService.saveFile(file, "products");

          ProductImage img = new ProductImage();
          img.setProduct(savedProduct);
          img.setImageUrl(path);
          img.setDisplayOrder(i);
          productImageRepository.save(img);
        }
      }
    }

    return ResponseEntity.status(HttpStatus.CREATED).body("Product created");
  }

  @PutMapping(value = "/{id}", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE})
  @Transactional
  public ResponseEntity<?> updateProduct(
          @PathVariable Integer id,
          @RequestPart("product") @Valid ProductSaveDto dto,
          @RequestPart(value = "imageFiles", required = false) List<MultipartFile> imageFiles) {

    // 1. Tìm sản phẩm cũ, nếu không có thì báo lỗi
    Product product = productRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm id: " + id));

    // 2. Cập nhật các thông tin cơ bản
    ProductGroup group = productGroupRepository.findById(dto.getGroupId())
            .orElseThrow(() -> new RuntimeException("Không tìm thấy nhóm sản phẩm"));
    product.setGroup(group);
    product.setVariantName(dto.getVariantName());
    product.setSlug(dto.getSlug());
    product.setSummary(dto.getSummary());
    product.setDescription(dto.getDescription());
    product.setImportPrice(dto.getImportPrice());
    product.setBasePrice(dto.getBasePrice());
    product.setSalePrice(dto.getSalePrice());
    product.setStockQuantity(dto.getStockQuantity());
    product.setWarrantyMonths(dto.getWarrantyMonths());
    product.setIsFeatured(dto.getIsFeatured());
    product.setStatus(dto.getStatus());
    Product savedProduct = productRepository.save(product);

    // 3. XỬ LÝ ẢNH: Nếu có danh sách ảnh mới gửi lên
    if (imageFiles != null && !imageFiles.isEmpty()) {
      // Lấy displayOrder lớn nhất hiện tại để cộng dồn vào sau (tránh trùng order)
      int currentMaxOrder = productImageRepository.findMaxDisplayOrderByProductId(id);

      for (int i = 0; i < imageFiles.size(); i++) {
        MultipartFile file = imageFiles.get(i);
        if (file != null && !file.isEmpty()) {
          String path = fileStorageService.saveFile(file, "products");

          ProductImage img = new ProductImage();
          img.setProduct(savedProduct);
          img.setImageUrl(path);
          // Cộng dồn vào sau các ảnh cũ
          img.setDisplayOrder(currentMaxOrder + i + 1);

          productImageRepository.save(img);
        }
      }
    }

    // 4. XỬ LÝ ATTRIBUTES: Xóa cũ, thêm mới (cách đơn giản nhất)
    productAttributeRepository.deleteAllByProductId(id);
    if (dto.getAttributes() != null) {
      List<ProductAttribute> newAttrs = dto.getAttributes().stream()
              .map(attrDto -> {
                ProductAttribute attr = new ProductAttribute();
                attr.setName(attrDto.getName());
                attr.setAttrValue(attrDto.getAttrValue());
                attr.setProduct(savedProduct);
                return attr;
              }).collect(Collectors.toList());
      productAttributeRepository.saveAll(newAttrs);
    }

    return ResponseEntity.ok("Product updated successfully");
  }

  @DeleteMapping("{productId}/images/{imageId}/delete")
  @Transactional
  public ResponseEntity<?> deleteProductImage(@PathVariable Integer productId, @PathVariable Integer imageId) {
    // 1. Tìm thông tin ảnh từ Database

    ProductImage image = productImageRepository.findById(imageId)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy ảnh có ID: " + imageId));

    if (image.getProduct().getId().equals(productId)) {

      // 2. Xóa file vật lý (Disk/Cloud)
      // Lưu ý: Cần xử lý logic xóa file thực tế trong service của bạn
      try {
        fileStorageService.deleteFile(image.getImageUrl());
      } catch (Exception e) {
        // Log lỗi nhưng vẫn tiếp tục xóa trong DB để tránh ảnh "rác" hiện trên giao diện
        System.err.println("Lỗi xóa file vật lý: " + e.getMessage());
      }

      // 3. Xóa bản ghi trong Database
      productImageRepository.delete(image);

      return ResponseEntity.ok("Xóa ảnh thành công");
    }
    throw new RuntimeException("Ảnh ko thuộc về sản phẩm");
  }

  @PatchMapping("/{productId}/images/{imageId}/make-thumbnail")
  @Transactional
  public ResponseEntity<?> makeThumbnail(@PathVariable Integer productId, @PathVariable Integer imageId) {
    // 1. Tìm ảnh muốn lên làm thumbnail
    ProductImage newThumb = productImageRepository.findById(imageId)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy ảnh có ID: " + imageId));

    // RÀNG BUỘC: Kiểm tra ảnh có thuộc về đúng sản phẩm truyền vào không
    if (!newThumb.getProduct().getId().equals(productId)) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST)
              .body(Map.of("error", "Ảnh này không thuộc về sản phẩm có ID: " + productId));
    }

    // 2. Tìm ảnh đang giữ vị trí displayOrder nhỏ nhất của sản phẩm đó
    // Lưu ý: Dùng findFirstByProductIdOrderByDisplayOrderAsc để lấy ảnh hiện tại là thumb
    Optional<ProductImage> currentThumbOpt = productImageRepository.findFirstByProductIdOrderByDisplayOrderAsc(productId);

    if (currentThumbOpt.isPresent()) {
      ProductImage currentThumb = currentThumbOpt.get();

      // Nếu ảnh được chọn ĐÃ là thumbnail rồi thì không cần làm gì cả
      if (currentThumb.getId().equals(imageId)) {
        return ResponseEntity.ok("Ảnh này đã là ảnh đại diện");
      }

      // Đổi chỗ order của 2 ảnh
      int tempOrder = newThumb.getDisplayOrder();
      newThumb.setDisplayOrder(currentThumb.getDisplayOrder()); // Thường là 0
      currentThumb.setDisplayOrder(tempOrder);

      productImageRepository.save(currentThumb);
    } else {
      // Nếu sản phẩm chưa hề có ảnh nào (trường hợp hi hữu) thì set thẳng là 0
      newThumb.setDisplayOrder(0);
    }

    productImageRepository.save(newThumb);
    return ResponseEntity.ok("Đã đổi ảnh đại diện thành công");
  }

  // 2. Cập nhật trạng thái nhanh (Ẩn/Hiện sản phẩm)
  @PatchMapping("/{id}/status")
  public ResponseEntity<?> updateStatus(@PathVariable Integer id, @RequestParam String status) {
    productRepository.updateStatus(id, status);
    return ResponseEntity.ok("Status updated");
  }

  // 3. Toggle sản phẩm nổi bật
  @PatchMapping("/{id}/featured")
  public ResponseEntity<?> toggleFeatured(@PathVariable Integer id) {
    productRepository.toggleIsFeatured(id);
    return ResponseEntity.ok("Featured toggled");
  }

  @GetMapping("/dashboard/summary")
  public ResponseEntity<?> getDashboardSummary() {
    Map<String, Object> summary = new HashMap<>();

    summary.put("totalProducts", productRepository.count());
    summary.put("activeProducts", productRepository.countByStatus("ACTIVE"));
    summary.put("outOfStock", productRepository.countByStockQuantityLessThan(5)); // Cảnh báo sắp hết hàng (<5)
    summary.put("featuredCount", productRepository.countByIsFeaturedTrue());

    // Thống kê theo danh mục (Sử dụng JPQL hoặc Native Query)
    // summary.put("categoryDistribution", categoryRepository.countProductsPerCategory());
    return ResponseEntity.ok(summary);
  }
}
