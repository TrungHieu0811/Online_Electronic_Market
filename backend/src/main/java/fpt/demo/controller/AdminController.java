package fpt.demo.controller;

import fpt.demo.entity.User;
import fpt.demo.repository.UserRepository;
import fpt.demo.service.UserServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminController {

    private final UserServiceImpl userService;
    private final UserRepository userRepository;

    // ===============================
    // 📌 1. GET USERS (SEARCH + PAGINATION)
    // ===============================
    @GetMapping
    public ResponseEntity<?> getUsers(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) Boolean status,
            @RequestParam(required = false) String role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        Page<User> users;

        if (!keyword.isEmpty()) {
            users = userRepository.searchUsers(keyword, pageable);
        } else {
            users = userRepository.findAll(pageable);
        }

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
}
