package com.financeportal.model.dto.common;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponseDto {
    private String message;

    public static MessageResponseDto of(String message) {
        return new MessageResponseDto(message);
    }
}
