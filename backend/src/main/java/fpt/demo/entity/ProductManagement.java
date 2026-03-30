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
@Table(name = "product_managements")
@Getter
@Setter
public class ProductManagement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    private User admin;

    @ManyToOne
    private ProductGroup group;

    @ManyToOne
    private Product product;

    private String actionType;

    private String columnChanged;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String oldValue;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String newValue;

    private String reason;

    private LocalDateTime createdAt;
}
