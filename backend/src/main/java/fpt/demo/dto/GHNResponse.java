/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package fpt.demo.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

/**
 *
 * @author hmn27
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class GHNResponse<T> {
    private int code;
    private String message;
    private T data;
}
