package fpt.demo.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class AdminCreationDto {
    @NotBlank(message = "Username cannot be blank")
    private String username;

    @NotBlank(message = "Email cannot be blank")
    @Email(message = "Invalid email format")
    private String email;

    private String fullName;

    // Cho phép để trống (vì account riêng), nhưng nếu nhập thì phải đúng 10 số và bắt đầu bằng số 0
    @Pattern(regexp = "^$|^0\\d{9}$", message = "Số điện thoại phải có 10 chữ số và bắt đầu bằng số 0")
    private String phone;
}