/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Interface.java to edit this template
 */
package fpt.demo.service;

/**
 *
 * @author banhn
 */
public interface EmailService {
    public void sendOtpEmail(String toEmail, String otpCode);
}
