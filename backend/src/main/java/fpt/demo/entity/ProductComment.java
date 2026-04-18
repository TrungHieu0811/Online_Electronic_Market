package fpt.demo.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "product_comments")
@Getter
@Setter
public class ProductComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    private Product product;

    @ManyToOne
    private ProductGroup group;

    @ManyToOne
    private User user;

    @ManyToOne
    @JoinColumn(name = "parent_id")
    private ProductComment parent;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String content;

    // true nếu đây là reply của admin/staff
    private Boolean isAdminReply = false;

    // trạng thái comment còn hiển thị hay không
    private Boolean status = true;

    // admin đã đọc comment này chưa
    private Boolean isReadByAdmin = false;

    // thời điểm admin đọc comment
    private LocalDateTime adminReadAt;

    // thời điểm tạo comment
    private LocalDateTime createdAt;
}