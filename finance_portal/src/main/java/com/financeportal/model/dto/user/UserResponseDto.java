package com.financeportal.model.dto.user;

import com.financeportal.model.enums.RiskProfile;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class UserResponseDto {
    private UUID id;
    private String name;
    private String email;
    private RiskProfile riskProfile;
    private LocalDateTime createdAt;
}