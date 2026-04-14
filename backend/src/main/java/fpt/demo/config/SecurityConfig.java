package fpt.demo.config;

import fpt.demo.jwt.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
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
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // public
                        .requestMatchers("/api/auth/**", "/error").permitAll()
                        .requestMatchers("/api/public/**").permitAll()

                        // file upload tĩnh
                        .requestMatchers("/uploads/**").permitAll()

                        // callback payment public
                        .requestMatchers("/api/users/payment/paypal-callback/**").permitAll()
                        .requestMatchers("/api/users/payment/cancel/**").permitAll()

                        // comment: ai cũng xem được
                        .requestMatchers(HttpMethod.GET, "/api/comments/product/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/comments/replies/**").permitAll()

                        // admin area
                        .requestMatchers("/api/admin/**").hasAnyAuthority("ROLE_STAFF", "ROLE_SUPERADMIN")

                        // user area
                        .requestMatchers("/api/users/**").hasAnyAuthority("ROLE_USER")

                        // user comment actions
                        .requestMatchers(HttpMethod.POST, "/api/comments/**").hasAuthority("ROLE_USER")
                        .requestMatchers(HttpMethod.PUT, "/api/comments/**").hasAuthority("ROLE_USER")
                        .requestMatchers(HttpMethod.DELETE, "/api/comments/**").hasAuthority("ROLE_USER")

                        .anyRequest().authenticated()
                )

                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                .authenticationProvider(authenticationProvider)
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOriginPatterns(List.of("*"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}