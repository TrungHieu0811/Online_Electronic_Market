/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package fpt.demo.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

/**
 *
 * @author ngo42
 */
@Entity
@Data
@Table(name = "order_managements")

public class OrderManagement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @JsonIgnore
    @ManyToOne
    private Order order;

    @ManyToOne
    private User admin;

    public enum ActionType{
        PENDING,
        CONFIRMED,
        SHIPPING,
        CANCELLED,
        DELIVERED,
        RETURNED
    }
    
    @Enumerated(EnumType.STRING)
    private ActionType actionType;

    private String previousStatus;
    private String newStatus;

    private String reason;

    private LocalDateTime createdAt;
}
