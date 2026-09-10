package com.financeportal.service.mapper.user;

import com.financeportal.model.dto.user.UserCreateDto;
import com.financeportal.model.dto.user.UserResponseDto;
import com.financeportal.model.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(source = "username", target = "name")
    UserResponseDto toDto(User user);

    User toEntity(UserCreateDto dto);
}