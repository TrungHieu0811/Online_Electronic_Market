/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package fpt.demo.dto;

import lombok.Data;

/**
 *
 * @author ngo42
 */
@Data
public class ReviewStatsDto {
    private long totalReviews;
    private long pendingCount;
    private long approvedToday;
    private long rejectedCount;
}