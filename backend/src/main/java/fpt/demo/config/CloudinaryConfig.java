/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package fpt.demo.config;

import com.cloudinary.Cloudinary;
import java.util.HashMap;
import java.util.Map;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 *
 * @author hmn27
 */
@Configuration
public class CloudinaryConfig {

    @Bean
    public Cloudinary cloudinary() {
        Map<String, String> config = new HashMap<>();
        
        // Ngọc lấy các thông tin này trong Dashboard của Cloudinary nhé
        config.put("cloud_name", "dzzyezjbh"); 
        config.put("api_key", "837927445365256");
        config.put("api_secret", "f_agyaGbWcbQQQhA-RIoK9XeLuc");
        
        return new Cloudinary(config);
    }
}
