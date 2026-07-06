package com.financeportal.model.dto.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeleteUserResponseDto {
    private boolean success;
    private boolean keycloakDeleted;
    private String message;
}
