package fpt.demo.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "categories", indexes = {
  @Index(name = "idx_category_parent_id", columnList = "parent_id")})
@Getter
@Setter
public class Category {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Integer id;

  @Column(unique = true, nullable = false)
  private String name;
  @Column(unique = true, nullable = false)
  private String slug;

  @ManyToOne
  @JoinColumn(name = "parent_id")
  private Category parent;

  private Boolean showVariantInList = false;
  private Boolean status = true;

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
