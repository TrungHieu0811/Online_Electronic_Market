package fpt.demo.mapper;

import fpt.demo.dto.CommentResponseDto;
import fpt.demo.dto.UserSimpleDto;
import fpt.demo.entity.ProductComment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.NullValueMappingStrategy;

@Mapper(componentModel = "spring", nullValueMappingStrategy = NullValueMappingStrategy.RETURN_NULL)
public interface CommentMapper {

    @Mapping(target = "user", source = "user")
    @Mapping(target = "replies", ignore = true)
    CommentResponseDto toDto(ProductComment comment);

    UserSimpleDto toUserSimpleDto(fpt.demo.entity.User user);
}