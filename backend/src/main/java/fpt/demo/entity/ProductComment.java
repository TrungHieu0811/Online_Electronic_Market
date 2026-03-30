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

    private Boolean isAdminReply = false;

    private Boolean status = true;

    private LocalDateTime createdAt;
}
