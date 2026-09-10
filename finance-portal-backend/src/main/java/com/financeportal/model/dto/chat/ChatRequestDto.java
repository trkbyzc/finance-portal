package com.financeportal.model.dto.chat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Kullanıcının chatbot'a gönderdiği mesaj.
 * conversationId null ise yeni bir sohbet açılır.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatRequestDto {
    private UUID conversationId;
    private String message;
    /** UI dili (tr | en). LLM'in hangi dilde yanıt vereceğini belirler. */
    private String locale;
}
