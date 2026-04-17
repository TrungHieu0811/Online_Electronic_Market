package fpt.demo.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "category_filter_configs")
@Getter
@Setter
@NoArgsConstructor
public class CategoryFilterConfig {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Integer id;

  @Column(unique = true, nullable = false)
  private String categorySlug; // mobile, laptop, tablet...

  @Column(columnDefinition = "NVARCHAR(MAX)", nullable = false)
  private String configData; // Lưu chuỗi JSON cấu hình

  private LocalDateTime updatedAt;

  @PrePersist
  @PreUpdate
  public void preUpdate() {
    updatedAt = LocalDateTime.now();
  }
}
