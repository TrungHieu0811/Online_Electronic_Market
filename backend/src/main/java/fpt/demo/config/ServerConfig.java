/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package fpt.demo.config;

import org.springframework.boot.tomcat.servlet.TomcatServletWebServerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 *
 * @author Admin
 */
@Configuration
public class ServerConfig {

  @Bean
  public TomcatServletWebServerFactory containerFactory() {
    TomcatServletWebServerFactory factory = new TomcatServletWebServerFactory();
    factory.addConnectorCustomizers(connector -> {
      // Ép thông số parameter count
      connector.setMaxParameterCount(10000);
      // Ép thông số Post Size (100MB)
      connector.setMaxPostSize(104857600);
    });
    return factory;
  }
}
