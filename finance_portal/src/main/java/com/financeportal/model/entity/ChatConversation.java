package com.financeportal.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Bir kullanıcının chatbot ile yaptığı tek bir sohbet (oturum).
 * Mesajlar ChatMessage'da, ayrı tabloda.
 */
@Entity
@Table(name = "chat_conversations", indexes = {
        @Index(name = "idx_chat_conv_user", columnList = "user_id"),
        @Index(name = "idx_chat_conv_updated", columnList = "user_id, updated_at DESC")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatConversation {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(length = 200)
    private String title;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
