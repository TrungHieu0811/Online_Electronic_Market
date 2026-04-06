package fpt.demo.config;

import fpt.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;

@Configuration
@RequiredArgsConstructor
public class ApplicationConfig {

    // Tiêm UserRepository vào để Spring Security có thể truy vấn Database
    private final UserRepository userRepository;

    // 1. Dạy Spring Security cách tìm User trong Database (Hàm bạn đang bị thiếu)
    @Bean
    public UserDetailsService userDetailsService() {
        return username -> {
            fpt.demo.entity.User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

            return new org.springframework.security.core.userdetails.User(
                    user.getUsername(),
                    user.getPassword(),
                    Collections.singletonList(new SimpleGrantedAuthority(user.getUserRole().name()))
            );
        };
    }

    // 2. Định nghĩa Provider xác thực (Đã sửa lỗi hàm tạo theo bản mới nhất)
    @Bean
    public AuthenticationProvider authenticationProvider() {
        // Truyền thẳng userDetailsService() vào trong ngoặc tròn
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(userDetailsService()); 
        authProvider.setPasswordEncoder(passwordEncoder()); 
        return authProvider;
    }

    // 3. Đăng ký AuthenticationManager
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    // 4. Đăng ký bộ mã hóa mật khẩu BCrypt
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}