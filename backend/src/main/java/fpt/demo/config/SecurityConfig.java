package fpt.demo.config;

import fpt.demo.jwt.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final AuthenticationProvider authenticationProvider;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Tắt bảo vệ CSRF vì chúng ta đang dùng JWT (stateless)
                .csrf(AbstractHttpConfigurer::disable)
                // THÊM DÒNG NÀY ĐỂ KÍCH HOẠT CORS
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                // CẤU HÌNH CÁC CỬA TẠI ĐÂY
                .authorizeHttpRequests(auth -> auth
                // MỞ KHÓA hoàn toàn các API bắt đầu bằng /api/auth (Cái này sẽ sửa lỗi 401 của bạn)
                .requestMatchers("/api/auth/**", "/error").permitAll()
                // Khóa khu vực Admin, chỉ những ai có role STAFF hoặc SUPERADMIN mới được vào
                .requestMatchers("/api/admin/**").hasAnyAuthority("ROLE_STAFF", "ROLE_SUPERADMIN")
                // Bất kỳ API nào khác đều phải có Token hợp lệ
                .anyRequest().authenticated()
                )
                // Thiết lập Session là Stateless (Server không nhớ ai đang đăng nhập, chỉ nhìn vào Token)
                .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authenticationProvider(authenticationProvider)
                // Bắt buộc request phải đi qua bộ lọc kiểm tra Token của chúng ta trước
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // THÊM HÀM NÀY ĐỂ CẤP PHÉP CHO FLUTTER WEB GỌI API
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Cho phép mọi domain gọi tới (Dùng dấu * cho môi trường dev)
        configuration.setAllowedOriginPatterns(List.of("*"));
        // Cho phép các method cần thiết
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        // Cho phép gửi Header chứa Token
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
