package com.financeportal.service.mapper.user;

import com.financeportal.model.dto.user.UserCreateDto;
import com.financeportal.model.dto.user.UserResponseDto;
import com.financeportal.model.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

// componentModel = "spring" sayesinde bu Mapper'ı @Autowired (veya private final) ile çağırabileceğiz.
@Mapper(componentModel = "spring")
public interface UserMapper {

    // Entity'deki 'username' alanını, DTO'daki 'name' alanına eşle diyoruz.
    @Mapping(source = "username", target = "name")
    UserResponseDto toDto(User user);

    // İleride lazım olursa: DTO'dan Entity'e çevirmek için
    User toEntity(UserCreateDto dto);
}