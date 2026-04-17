package fpt.demo.service;

import org.springframework.stereotype.Service;

import fpt.demo.dto.UserProfileResponseDto;
import fpt.demo.entity.User;
import fpt.demo.entity.UserManagement;
import fpt.demo.repository.RefreshTokenRepository;
import fpt.demo.repository.UserManagementRepository;
import fpt.demo.repository.UserRepository; // Nhớ import Interface
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

  private final UserRepository userRepository;
  private final RefreshTokenRepository refreshTokenRepository;
  private final UserManagementRepository userManagementRepository;
  private final EmailService emailService;

  @Override
  public UserProfileResponseDto getUserProfile(String username) {
    User user = userRepository.findByUsername(username)
        .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));

    return UserProfileResponseDto.builder()
        .id(user.getId())
        .username(user.getUsername())
        .email(user.getEmail())
        .fullName(user.getFullName())
        .phone(user.getPhone())
        .address(user.getAddress())
        .gender(user.getGender())
        .dob(user.getDob())
        .avatarUrl(user.getAvatarUrl())
        .rewardPoints(user.getRewardPoints())
        .ratingScore(user.getRatingScore())
        .userRole(user.getUserRole().name())
        .emailConfirmed(user.getEmailConfirmed())
        .createdAt(user.getCreatedAt())
        .build();
  }

  @Override
  @Transactional
  public UserProfileResponseDto updateProfile(String username, UserProfileResponseDto updateRequest) {
    User user = userRepository.findByUsername(username)
        .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));

    if (updateRequest.getFullName() != null) {
      user.setFullName(updateRequest.getFullName());
    }
    if (updateRequest.getPhone() != null) {
      user.setPhone(updateRequest.getPhone());
    }
    if (updateRequest.getAddress() != null) {
      user.setAddress(updateRequest.getAddress());
    }
    if (updateRequest.getGender() != null) {
      user.setGender(updateRequest.getGender());
    }
    if (updateRequest.getDob() != null) {
      user.setDob(updateRequest.getDob());
    }
    if (updateRequest.getAvatarUrl() != null) {
      user.setAvatarUrl(updateRequest.getAvatarUrl());
    }

    userRepository.save(user);
    return getUserProfile(username);
  }

  @Override
  @Transactional
  public void disableUser(Integer targetUserId, Integer adminId, String reasonText) {
    User targetUser = userRepository.findById(targetUserId)
        .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng cần khóa!"));

    User admin = userRepository.findById(adminId)
        .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thông tin Admin!"));

    targetUser.setStatus(false);
    userRepository.save(targetUser);

    refreshTokenRepository.deleteAllByUser(targetUser);

    UserManagement log = new UserManagement();
    log.setAdmin(admin);
    log.setUser(targetUser);
    log.setActionType("BLOCK");
    log.setDetails("Trạng thái chuyển thành khóa, thu hồi toàn bộ phiên đăng nhập.");
    log.setReason(reasonText);
    userManagementRepository.save(log);
    if (targetUser.getEmail() != null && !targetUser.getEmail().isBlank()) {
      emailService.sendUserBlockedEmail(
          targetUser.getEmail(),
          targetUser.getFullName(),
          reasonText);
    }
  }
}