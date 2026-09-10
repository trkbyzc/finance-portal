package com.financeportal.model.dto.chat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatResponseDto {
    private UUID conversationId;
    private ChatMessageDto message;
    /** Yanıtı üreten provider ("groq" / "gemini") — frontend "X tarafından üretildi" gösterebilir. */
    private String provider;
    private String model;
}
