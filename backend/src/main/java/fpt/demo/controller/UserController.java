package fpt.demo.controller;

import fpt.demo.dto.UserProfileResponseDto;
import fpt.demo.service.UserServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import fpt.demo.dto.UserUpdateDto;
import fpt.demo.entity.User;
import fpt.demo.repository.UserRepository;

import java.security.Principal;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserServiceImpl userService;
    private final UserRepository userRepository;

    // Lấy thông tin cá nhân
    @GetMapping("/me")
    public ResponseEntity<UserProfileResponseDto> getMyProfile(Principal principal) {
        // principal.getName() chính là username được trích xuất từ JWT Token
        UserProfileResponseDto profile = userService.getUserProfile(principal.getName());
        return ResponseEntity.ok(profile);
    }
    
    // Cập nhật thông tin cá nhân
//    @PutMapping("/me")
//    public ResponseEntity<UserProfileResponseDto> updateMyProfile(
//            Principal principal,
//            @RequestBody UserProfileResponseDto updateRequest) {
//        
//        UserProfileResponseDto updatedProfile = userService.updateProfile(principal.getName(), updateRequest);
//        return ResponseEntity.ok(updatedProfile);
//    }
    @PutMapping("/me")
    public ResponseEntity<?> updateProfile(Principal principal, @RequestBody UserUpdateDto request) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("You are not logged in.!");
        }

        // Tìm user đang đăng nhập
        User currentUser = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("No user found!"));

        // Kiểm tra xem user có gửi dữ liệu nào lên không thì mới cập nhật dữ liệu đó
        if (request.getFullName() != null && !request.getFullName().isEmpty()) {
            currentUser.setFullName(request.getFullName());
        }
        if (request.getPhone() != null && !request.getPhone().isEmpty()) {
            // Lưu ý: Nếu muốn an toàn, bạn nên thêm check trùng số điện thoại ở đây
            currentUser.setPhone(request.getPhone());
        }
        if (request.getAddress() != null) {
            currentUser.setAddress(request.getAddress());
        }
        if (request.getGender() != null) {
            currentUser.setGender(request.getGender());
        }
        if (request.getDob() != null) {
            currentUser.setDob(request.getDob());
        }
        if (request.getAvatarUrl() != null) {
            currentUser.setAvatarUrl(request.getAvatarUrl());
        }

        // Lưu lại vào DB   
        userRepository.save(currentUser);

        return ResponseEntity.ok("Information updated successfully!");
    }
}
