package fpt.demo.controller;

import fpt.demo.dto.UserProfileResponseDto;
import fpt.demo.dto.UserUpdateDto;
import fpt.demo.entity.User;
import fpt.demo.repository.UserRepository;
import fpt.demo.service.FileStorageService;
import fpt.demo.service.UserServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import fpt.demo.dto.UserUpdateDto;
import fpt.demo.entity.User;
import fpt.demo.repository.UserRepository;

import java.security.Principal;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserServiceImpl userService;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    // Get current user profile
    @GetMapping("/me")
    public ResponseEntity<UserProfileResponseDto> getMyProfile(Principal principal) {
        UserProfileResponseDto profile = userService.getUserProfile(principal.getName());
        return ResponseEntity.ok(profile);
    }

    // Update current user profile
    @PutMapping("/me")
    public ResponseEntity<?> updateProfile(Principal principal, @RequestBody UserUpdateDto request) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("You are not logged in!");
        }

        // Find current logged-in user
        User currentUser = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found!"));

        // Update only fields that are provided
        if (request.getFullName() != null && !request.getFullName().isEmpty()) {
            currentUser.setFullName(request.getFullName());
        }
        if (request.getPhone() != null && !request.getPhone().isEmpty()) {
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

        // Save to DB
        userRepository.save(currentUser);

        UserProfileResponseDto updatedProfile = userService.getUserProfile(principal.getName());
        return ResponseEntity.ok(updatedProfile);
    }

    // Upload avatar
    @PostMapping("/upload-avatar")
    public ResponseEntity<?> uploadAvatar(
            @RequestParam("file") MultipartFile file,
            Principal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("You are not logged in!");
        }

        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body("Please select an image!");
        }

        User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found!"));

        // Delete old avatar if it exists
        if (user.getAvatarUrl() != null && !user.getAvatarUrl().isEmpty()) {
            fileStorageService.deleteFile(user.getAvatarUrl());
        }

        // Save new file
        String filePath = fileStorageService.saveFile(file, "avatars");

        // Save new avatar path to DB
        user.setAvatarUrl(filePath);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
                "message", "Avatar uploaded successfully!",
                "avatarUrl", filePath
        ));
    }
}