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
        config.put("cloud_name", "dqt9oypmn");
        config.put("api_key", "264298955388498");
        config.put("api_secret", "bHzq_3ckFFWAzFPr6XSMOOj6o2c");
        
//        config.put("cloud_name", "dcqyssqb0");
//        config.put("api_key", "933131796147321");
//        config.put("api_secret", "Z5BqoNfjKIN7ZyGf_Y4z6OTa1F0");
        
        return new Cloudinary(config);
    }
}
