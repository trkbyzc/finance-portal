package com.financeportal.model.dto.chat;

import com.financeportal.model.enums.ChatRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Tek bir chat mesajının istemciye serileştirilmiş hali.
 * toolName: role=TOOL ise hangi tool'un sonucunu döndüğü (frontend "chip" gösterebilir).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageDto {
    private UUID id;
    private ChatRole role;
    private String content;
    private String toolName;
    private String modelUsed;
    private LocalDateTime createdAt;
}
