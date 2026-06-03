package com.financeportal.repository;

import com.financeportal.model.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {

    /** Bir sohbetin tüm mesajları, kronolojik. */
    List<ChatMessage> findByConversation_IdOrderByCreatedAtAsc(UUID conversationId);

    /** Son N mesajı çekmek için (kronolojik tersinde — sonra app'te ters çevrilir). */
    List<ChatMessage> findTop20ByConversation_IdOrderByCreatedAtDesc(UUID conversationId);
}
