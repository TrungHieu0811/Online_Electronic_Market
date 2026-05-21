package fpt.demo.controller;

import fpt.demo.dto.AdminCreationDto;
import fpt.demo.dto.ChangePasswordDto;
import java.security.Principal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import fpt.demo.entity.User;
import fpt.demo.repository.UserRepository;
import fpt.demo.service.AuthService;
import fpt.demo.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PutMapping;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminController {

    private final UserService userService;
    private final UserRepository userRepository;
    private final AuthService authService;

    // ===============================
    // 📌 1. GET USERS (SEARCH + PAGINATION + TAB FILTER)
    // ===============================
    @GetMapping
    public ResponseEntity<?> getUsers(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) Boolean status,
            @RequestParam(required = false) String role,
            // 👉 ĐÓN THAM SỐ TAB TỪ FRONTEND (Mặc định là tab USER)
            @RequestParam(required = false, defaultValue = "USER") String roleType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        // 👉 GỌI XUỐNG HÀM MỚI Ở SERVICE ĐỂ NÓ LO VIỆC LỌC 10 NGƯỜI/TRANG CHUẨN XÁC
        Page<User> users = userService.getAdminUsers(keyword, roleType, pageable);

        // Giữ nguyên logic map dữ liệu rất chuẩn của bạn
        List<Map<String, Object>> result = users.getContent().stream().map(user -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", user.getId());
            map.put("name", user.getFullName());
            map.put("email", user.getEmail());
            map.put("role", user.getUserRole().name());
            map.put("status", Boolean.TRUE.equals(user.getStatus()) ? "Active" : "Blocked");
            map.put("createdAt", user.getCreatedAt());
            map.put("avatar", user.getAvatarUrl());
            return map;
        }).toList();

        return ResponseEntity.ok(Map.of(
                "content", result,
                "totalPages", users.getTotalPages(),
                "totalElements", users.getTotalElements(),
                "currentPage", page
        ));
    }

    // ===============================
    // 📌 2. BLOCK USER
    // ===============================
    @PostMapping("/{userId}/disable")
    public ResponseEntity<?> disableUser(
            @PathVariable Integer userId,
            @RequestBody Map<String, String> requestBody,
            Principal principal
    ) {
        String reason = requestBody.getOrDefault("reason", "Vi phạm");

        User admin = userRepository.findByUsername(principal.getName())
                .orElseThrow();

        userService.disableUser(userId, admin.getId(), reason);

        return ResponseEntity.ok(Map.of("message", "User blocked"));
    }

    // ===============================
    // 📌 3. UNBLOCK USER
    // ===============================
    @PostMapping("/{userId}/enable")
    public ResponseEntity<?> enableUser(@PathVariable Integer userId) {

        User user = userRepository.findById(userId)
                .orElseThrow();

        user.setStatus(true);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "User unblocked"));
    }

    // ===============================
    // 📌 4. STATS
    // ===============================
    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {

        long totalUsers = userRepository.count();
        long blocked = userRepository.countByStatus(false);

        LocalDateTime today = LocalDateTime.now().toLocalDate().atStartOfDay();
        long newToday = userRepository.countByCreatedAtAfter(today);

        return ResponseEntity.ok(Map.of(
                "totalUsers", totalUsers,
                "blockedUsers", blocked,
                "newToday", newToday
        ));
    }
    
    // 👉 PHÉP THUẬT BẢO MẬT Ở ĐÂY:
    // Chỉ những token có quyền SUPERADMIN hoặc ROLE_SUPERADMIN mới được phép chạy hàm này
    @PreAuthorize("hasAuthority('ROLE_SUPERADMIN')")
    @PostMapping("/create-admin")
    public ResponseEntity<?> createAdmin(@Valid @RequestBody AdminCreationDto request) {
        // Không cần try...catch nữa, cứ để lỗi văng ra cho GlobalExceptionHandler chụp lại!
        String message = authService.createAdmin(request);
        return ResponseEntity.ok(Map.of("message", message));
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(@Valid @RequestBody ChangePasswordDto request, Principal principal) {
        // Principal chứa username của người đang nắm giữ Token
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "You have not login yet!"));
        }
        
        authService.changePassword(principal.getName(), request.getNewPassword());
        return ResponseEntity.ok(Map.of("message", "Change password successfully"));
    }
}
