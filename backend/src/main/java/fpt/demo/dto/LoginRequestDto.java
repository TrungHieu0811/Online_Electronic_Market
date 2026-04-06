package fpt.demo.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequestDto {
    
    @NotBlank(message = "Username cannot be left blank.")
    private String username;

    @NotBlank(message = "Password cannot be left blank.")
    private String password;
}