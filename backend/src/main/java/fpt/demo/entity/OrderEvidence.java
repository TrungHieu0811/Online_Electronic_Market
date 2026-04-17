/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package fpt.demo.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Data;
import lombok.ToString;

/**
 *
 * @author hmn27
 */
@Entity
@Data
@Table(name = "order_evidences")
public class OrderEvidence {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @JsonIgnore
    @ManyToOne 
    @JoinColumn(name = "order_id")
    @ToString.Exclude
    private Order order; // Liên kết với đơn hàng

    private String imageUrl; // Link ảnh trên Cloudinary
    private String publicId; // ID quản lý ảnh trên Cloudinary

    // --- Kết quả từ Cloudinary AI ---
    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String aiLabels; // Lưu dạng chuỗi: "box:0.98, receipt:0.85"
    
    private Boolean isValid; // AI xác nhận đúng là ảnh giao hàng hay không
    private LocalDateTime createdAt;
}
