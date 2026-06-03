package com.financeportal.model.dto.chat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Sohbet listesi öğesi — başlık + zaman bilgisi.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConversationDto {
    private UUID id;
    private String title;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
