/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package fpt.demo.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import java.util.Map;
import org.springframework.stereotype.Service;

/**
 *
 * @author hmn27
 */
@Service
public class OrderEvidenceService {

    private final Cloudinary cloudinary;

    public OrderEvidenceService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    public Map uploadAndAnalyze(String imageUrl) throws Exception {
        // Upload và yêu cầu AI trả về các nhãn nhận diện
        return cloudinary.uploader().upload(imageUrl, ObjectUtils.asMap(
                "folder", "order_evidences",
                //                "tags", "true" // Chỉ lấy các tag có độ tin cậy trên 60%
                "categorization", "google_tagging",
                "auto_tagging", 0.4,
                "ocr", "adv_ocr"
        ));
    }
}
