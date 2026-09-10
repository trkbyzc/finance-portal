package com.financeportal.model.entity;

import com.financeportal.model.enums.ChatRole;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * ChatConversation altındaki sıralı mesajlardan biri.
 * - role=USER: kullanıcının mesajı
 * - role=ASSISTANT: LLM'in yanıtı (toolCalls dolabilir — assistant'ın çağırdığı tool'lar)
 * - role=TOOL: bir tool çağrısının sonucu (LLM'e geri verilen veri); toolName dolu olur
 * - role=SYSTEM: nadiren saklarız; çoğunlukla runtime'da prepend edilir
 */
@Entity
@Table(name = "chat_messages", indexes = {
        @Index(name = "idx_chat_msg_conv_created", columnList = "conversation_id, created_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conversation_id", nullable = false)
    private ChatConversation conversation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private ChatRole role;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "tool_calls", columnDefinition = "TEXT")
    private String toolCalls;

    @Column(name = "tool_name", length = 64)
    private String toolName;

    @Column(name = "model_used", length = 64)
    private String modelUsed;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
