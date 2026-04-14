package fpt.demo.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "product_attributes", indexes = {
  // Index kết hợp cho Name và Value để tìm kiếm cực nhanh
  @Index(name = "idx_attr_name_value", columnList = "name, attrValue"),
  // Index cho product_id để tối ưu Subquery/Join
  @Index(name = "idx_attr_product_id", columnList = "product_id")
})
@Getter
@Setter
public class ProductAttribute {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Integer id;

  @ManyToOne
  @JsonBackReference
  private Product product;

  private String name="";
  private String attrValue="";
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
}
