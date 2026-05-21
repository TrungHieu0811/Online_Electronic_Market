package fpt.demo.service;

import fpt.demo.dto.UserProfileResponseDto;
import fpt.demo.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface UserService {
    UserProfileResponseDto getUserProfile(String username);
    
    UserProfileResponseDto updateProfile(String username, UserProfileResponseDto updateRequest);
    
    void disableUser(Integer targetUserId, Integer adminId, String reasonText);
    
    
    Page<User> getAdminUsers(String keyword, String roleType, Pageable pageable);
}