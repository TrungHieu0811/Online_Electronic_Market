/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package fpt.demo.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

/**
 *
 * @author ngo42
 */
@Entity
@Table(name = "products")
@Getter
@Setter
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "group_id")
    private ProductGroup group;

    private String variantName;
    private String slug;

    private String summary;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String description;

    private Double importPrice;
    private Double basePrice;
    private Double salePrice;

    private Integer stockQuantity = 0;

    private Integer warrantyMonths;

    private Boolean isFeatured = false;

    private String status = "ACTIVE";

    private Integer viewCount = 0;

    private Double averageRating = 5.0;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
