package fpt.demo.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "brand_categories", indexes = {
  @Index(name = "idx_brand_cat_category_id", columnList = "category_id"),
  @Index(name = "idx_brand_cat_brand_id", columnList = "brand_id")
}, uniqueConstraints = {
  @UniqueConstraint(name = "uc_brand_category", columnNames = {"brand_id", "category_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BrandCategory {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Integer id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "brand_id", nullable = false)
  private Brand brand;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "category_id", nullable = false)
  private Category category;
}
