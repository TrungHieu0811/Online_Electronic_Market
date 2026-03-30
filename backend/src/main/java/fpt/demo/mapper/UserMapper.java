package fpt.demo.mapper;

import fpt.demo.dto.UserRegistrationDto;
import fpt.demo.dto.UserProfileResponseDto;
import fpt.demo.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface UserMapper {

    // 1. Chuyển từ DTO đăng ký sang Entity User (Dùng trong lúc Register)
    User toUser(UserRegistrationDto dto);

    // 2. Chuyển từ Entity User sang DTO Profile (Dùng để trả dữ liệu ra API)
    UserProfileResponseDto toUserProfileResponseDto(User entity);

    // 3. Cập nhật dữ liệu từ DTO vào Entity có sẵn (Dùng khi update thông tin cá nhân)
    // Thuộc tính IGNORE ở trên giúp: Nếu trường DTO là null thì giữ nguyên giá trị cũ trong DB
    void updateUserFromDto(UserProfileResponseDto dto, @MappingTarget User entity);
}