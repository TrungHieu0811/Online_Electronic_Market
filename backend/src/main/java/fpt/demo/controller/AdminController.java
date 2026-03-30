package fpt.demo.controller;

import fpt.demo.entity.User;
import fpt.demo.repository.UserRepository;
import fpt.demo.service.UserServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminController {

    private final UserServiceImpl userService;
    private final UserRepository userRepository; // Dùng tạm để lấy ID của admin đang thao tác

    // Khóa tài khoản người dùng
    // URL ví dụ: POST /api/admin/users/5/disable
    @PostMapping("/{userId}/disable")
    public ResponseEntity<?> disableUser(
            @PathVariable Integer userId,
            @RequestBody Map<String, String> requestBody,
            Principal principal) {
        
        try {
            // Lấy lý do khóa từ body JSON (ví dụ: {"reason": "Bom hàng 3 lần"})
            String reasonText = requestBody.getOrDefault("reason", "Vi phạm chính sách");

            // Lấy ID của Admin đang thực hiện hành động này
            User admin = userRepository.findByUsername(principal.getName())
                    .orElseThrow(() -> new RuntimeException("Lỗi xác thực Admin"));

            // Gọi hàm xử lý nghiệp vụ
            userService.disableUser(userId, admin.getId(), reasonText);

            return ResponseEntity.ok(Map.of("message", "Đã khóa tài khoản thành công!"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}