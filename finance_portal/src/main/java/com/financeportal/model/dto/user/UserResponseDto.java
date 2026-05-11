package com.financeportal.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserResponseDto {
    private UUID id;
    private String name;
    private String email;
    private LocalDateTime createdAt;
}