package fpt.demo.controller;

import fpt.demo.service.OrderEvidenceService; // Import Service mới
import fpt.demo.service.OrderManagementService;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public/webhook")
@RequiredArgsConstructor
public class DeliveryWebhookController {

    private final OrderManagementService managementService;
    private final OrderEvidenceService evidenceService; 

    @PostMapping("/ghn")
    public ResponseEntity<?> handleGHNWebhook(@RequestBody Map<String, Object> payload) {
        try {
            // 1. Nhận dữ liệu đầu vào
            Object idObj = payload.get("orderId");
            String imageData = (String) payload.get("image");
            if (idObj == null || imageData == null) {
                return ResponseEntity.badRequest().body("Missing data");
            }
            Integer orderId = Integer.valueOf(idObj.toString());

            Map uploadResult = evidenceService.uploadAndAnalyze(imageData);
            String finalImageUrl = (String) uploadResult.get("secure_url");
            String orderCodeToFind = "#EM-" + orderId; // Ví dụ: #EM-24

            boolean hasPackage = false;
            boolean hasOrderCode = false;

            List<String> finalTagsList = new ArrayList<>();
            if (uploadResult.containsKey("tags")) {
                Object tagsObj = uploadResult.get("tags");
                if (tagsObj instanceof List) {
                    List<?> rawTags = (List<?>) tagsObj;
                    for (Object tag : rawTags) {
                        finalTagsList.add(tag.toString().toLowerCase()); 
                    }
                }
            }

            hasPackage = finalTagsList.stream().anyMatch(t
                    -> t.contains("box") || t.contains("package") || t.contains("carton") || t.contains("rectangle")
            );

            if (uploadResult.containsKey("info")) {
                Map info = (Map) uploadResult.get("info");
                if (info.containsKey("ocr")) {
                    String fullTextDetected = info.toString().toUpperCase();

                    if (fullTextDetected.contains(orderCodeToFind.toUpperCase())) {
                        hasOrderCode = true;
                    }
                }
            }

            if (!hasPackage) {
                return ResponseEntity.badRequest().body("AI REJECTED: No package detected.");
            }

            if (!hasOrderCode) {
                return ResponseEntity.badRequest().body("AI REJECTED: Order code " + orderCodeToFind + " not found in image.");
            }

            // 4. Lưu vào Database và hoàn tất xác minh
            managementService.processAIVerification(orderId, finalImageUrl, true, "Verified: Box & Code " + orderCodeToFind);

            return ResponseEntity.ok("Verified: Package and Order Code detected!");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }
}
