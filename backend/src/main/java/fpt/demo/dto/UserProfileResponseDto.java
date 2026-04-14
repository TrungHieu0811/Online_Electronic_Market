package fpt.demo.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@Builder
@NoArgsConstructor // THÊM DÒNG NÀY
@AllArgsConstructor // THÊM DÒNG NÀY
public class UserProfileResponseDto {
    private Integer id;
    private String username;
    private String email;
    private String fullName;
    private String phone;
    private String address;
    private Integer gender;
    private LocalDate dob;
    private String avatarUrl;
    private Integer rewardPoints;
    private Double ratingScore;
    private String userRole;
    private Boolean emailConfirmed;
    private LocalDateTime createdAt;
}