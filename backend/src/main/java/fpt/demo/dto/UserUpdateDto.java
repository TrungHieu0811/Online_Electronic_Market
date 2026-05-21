package fpt.demo.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class UserUpdateDto {
    private String fullName;
    private String phone;
    private String address;
    private Integer gender; // Ví dụ: 0 = Nữ, 1 = Nam, 2 = Khác
    private LocalDate dob;  // Ngày sinh (Spring Boot tự hiểu chuẩn yyyy-MM-dd)
    private String avatarUrl;
}