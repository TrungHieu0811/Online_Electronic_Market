package fpt.demo.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UserRegistrationDto {

    @NotBlank(message = "Username cannot be left blank.")
    @Size(min = 4, max = 50, message = "Usernames must be between 4 and 50 characters long.")
    private String username;

    @NotBlank(message = "Email cannot be left blank.")
    @Email(message = "Invalid email")
    private String email;

    @NotBlank(message = "Password cannot be left blank.")
    @Size(min = 6, message = "Password must be at least 6 characters long.")
    private String password;
    // THÊM TRƯỜNG NÀY ĐỂ NHẬN XÁC NHẬN MẬT KHẨU
    @NotBlank(message = "Please confirm your password.")
    private String confirmPassword;

    @NotBlank(message = "Full name cannot be left blank.")
    private String fullName;
    
    // --- THÊM SỐ ĐIỆN THOẠI VÀO ĐÂY ---
    @NotBlank(message = "Phone number cannot be left blank.")
    @Pattern(regexp = "(84|0[3|5|7|8|9])+([0-9]{8})\\b", message = "Phone number is invalid (Must be a valid Vietnamese phone number, 10 digits)")
    private String phone;
}