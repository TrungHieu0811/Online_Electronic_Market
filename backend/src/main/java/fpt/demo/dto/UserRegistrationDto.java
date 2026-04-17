package fpt.demo.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UserRegistrationDto {

  @NotBlank(message = "Username không được để trống")
  @Size(min = 4, max = 50, message = "Username phải từ 4 đến 50 ký tự")
  @Pattern(regexp = "^[a-zA-Z0-9_]*$", message = "Username không được chứa khoảng trắng hoặc ký tự đặc biệt")
  private String username;

  @NotBlank(message = "Email không được để trống")
  @Email(message = "Email không hợp lệ")
  private String email;

  @NotBlank(message = "Mật khẩu không được để trống")
  @Size(min = 6, message = "Mật khẩu phải có ít nhất 6 ký tự")
  private String password;
  // THÊM TRƯỜNG NÀY ĐỂ NHẬN XÁC NHẬN MẬT KHẨU
  @NotBlank(message = "Vui lòng xác nhận mật khẩu")
  private String confirmPassword;

  @NotBlank(message = "Họ và tên không được để trống")
  private String fullName;

  // --- THÊM SỐ ĐIỆN THOẠI VÀO ĐÂY ---
  @NotBlank(message = "Số điện thoại không được để trống")
  @Pattern(regexp = "(84|0[3|5|7|8|9])+([0-9]{8})\\b", message = "Số điện thoại không hợp lệ (Phải là số Việt Nam, 10 số)")
  private String phone;
}
