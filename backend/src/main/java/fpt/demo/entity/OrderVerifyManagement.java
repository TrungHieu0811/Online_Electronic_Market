/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package fpt.demo.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
@Table(name = "order_verify_managements")
@Getter
@Setter
public class OrderVerifyManagement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    private Order order;

    @ManyToOne
    private User admin;

    private Integer attemptNumber;

    private String verifyMethod = "PHONE_CALL";

    public enum Status {
        SUCCESS,
        NO_ANSWER,
        WRONG_NUMBER,
        REJECTED
    }
    @Enumerated(EnumType.STRING)
    private Status status;

    private String note;

    private LocalDateTime createdAt;
}
