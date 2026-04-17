package fpt.demo.entity;

import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.CascadeType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.util.ArrayList;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "products", indexes = {
  @Index(name = "idx_product_price", columnList = "importPrice"),
  @Index(name = "idx_product_group", columnList = "group_id"),
  @Index(name = "idx_product_view_count", columnList = "view_count"),
  @Index(name = "idx_product_created_at", columnList = "createdAt"),
  @Index(name = "idx_product_featured_status", columnList = "isFeatured, status"),
  @Index(name = "idx_product_sale_price", columnList = "salePrice")})
@Getter
@Setter
public class Product {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Integer id;

  @ManyToOne
  @JoinColumn(name = "group_id")
  private ProductGroup group;

  @Column(unique = true, nullable = false)
  private String variantName;
  @Column(unique = true, nullable = false)
  private String slug;

  private String summary = "";

  @Column(columnDefinition = "NVARCHAR(MAX)")
  private String description = "";

  private Double importPrice = 0.0;
  private Double basePrice = 0.0;
  private Double salePrice = 0.0;

  private Integer stockQuantity = 0;

  private Integer warrantyMonths = 0;

  private Boolean isFeatured = false;

  private String status = "ACTIVE";

  private Integer viewCount = 0;

  private Double averageRating = 5.0;

  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;

  @PrePersist
  public void prePersist() {
    createdAt = LocalDateTime.now();
    updatedAt = LocalDateTime.now();
  }

  @PreUpdate
  public void preUpdate() {
    updatedAt = LocalDateTime.now();
  }

  @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
  @JsonManagedReference
  private List<ProductAttribute> attributes = new ArrayList<>();
}
