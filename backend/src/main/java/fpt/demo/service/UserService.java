package fpt.demo.service;

import fpt.demo.dto.UserProfileResponseDto;

public interface UserService {
    UserProfileResponseDto getUserProfile(String username);
    
    UserProfileResponseDto updateProfile(String username, UserProfileResponseDto updateRequest);
    
    void disableUser(Integer targetUserId, Integer adminId, String reasonText);
}