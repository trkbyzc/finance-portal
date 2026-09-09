package com.financeportal.service.chat;

import com.financeportal.exception.ResourceNotFoundException;
import com.financeportal.model.dto.chat.ChatMessageDto;
import com.financeportal.model.dto.chat.ChatRequestDto;
import com.financeportal.model.dto.chat.ChatResponseDto;
import com.financeportal.model.dto.chat.ConversationDto;
import com.financeportal.model.entity.ChatConversation;
import com.financeportal.model.entity.ChatMessage;
import com.financeportal.model.entity.User;
import com.financeportal.model.enums.ChatRole;
import com.financeportal.repository.ChatConversationRepository;
import com.financeportal.repository.ChatMessageRepository;
import com.financeportal.repository.UserRepository;
import com.financeportal.security.SecurityUtils;
import com.financeportal.service.chat.llm.LlmProviderGateway;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

/**
 * FinansPortal chatbot servisi.
 * - Conversation CRUD (kullanıcı sahipliği guard'lı)
 * - Mesaj gönder → LLM çağrısı → yanıtı persist → DTO döndür
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final ChatConversationRepository convRepo;
    private final ChatMessageRepository msgRepo;
    private final UserRepository userRepo;
    private final SecurityUtils securityUtils;
    private final LlmProviderGateway llmGateway;
    private final SystemPromptBuilder systemPromptBuilder;

    @Value("${app.chat.history-max:20}")
    private int historyMax;


    @Transactional(readOnly = true)
    public List<ConversationDto> listMyConversations() {
        UUID userId = securityUtils.getCurrentUserId();
        return convRepo.findByUser_IdOrderByUpdatedAtDesc(userId).stream()
                .map(this::toConvDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ChatMessageDto> getMessages(UUID conversationId) {
        ChatConversation c = requireOwned(conversationId);
        return msgRepo.findByConversation_IdOrderByCreatedAtAsc(c.getId()).stream()
                .filter(m -> m.getRole() == ChatRole.USER || m.getRole() == ChatRole.ASSISTANT)
                .filter(m -> m.getContent() != null && !m.getContent().isBlank())
                .map(this::toMsgDto)
                .toList();
    }

    @Transactional
    public void deleteConversation(UUID conversationId) {
        ChatConversation c = requireOwned(conversationId);
        convRepo.delete(c);
    }

    /**
     * Yeni mesaj: conversationId null ise yeni sohbet açar, persist eder ve LLM'e gönderir.
     */
    @Transactional
    public ChatResponseDto sendMessage(ChatRequestDto req) {
        if (req.getMessage() == null || req.getMessage().isBlank()) {
            throw new IllegalArgumentException("Mesaj boş olamaz");
        }
        UUID userId = securityUtils.getCurrentUserId();
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı bulunamadı"));

        ChatConversation conv = (req.getConversationId() == null)
                ? createConversation(user, req.getMessage())
                : requireOwned(req.getConversationId());

        LocalDateTime now = LocalDateTime.now();
        ChatMessage userMsg = ChatMessage.builder()
                .conversation(conv)
                .role(ChatRole.USER)
                .content(req.getMessage().trim())
                .createdAt(now)
                .build();
        msgRepo.save(userMsg);

        // 2) Sohbet geçmişinden model bağlamını kur.
        List<Message> context = buildContext(conv, req.getLocale());

        // 3) Modeli çağır.
        //
        // Araç çağrılarının çok turlu döngüsü artık burada DEĞİL: model bir araç istediğinde
        // Spring AI onu çalıştırıp sonucu modele geri veriyor ve nihai metin gelene kadar
        // döngüyü kendisi çeviriyor. Önceden bu blok elle yazılmış bir for döngüsüydü;
        // ara ASSISTANT/TOOL mesajlarını bağlama eklemek, tool_call kimliklerini eşlemek
        // ve yineleme sayısını sınırlamak bize aitti.
        //
        // Buna bağlı bir davranış değişikliği: ara araç sonuçları artık TOOL rolüyle
        // veritabanına yazılmıyor. O kayıtlar arayüzde zaten gösterilmiyordu
        // (getMessages yalnızca USER + ASSISTANT döner), yalnızca dahili bir izdi.
        LlmProviderGateway.LlmResult llm = llmGateway.generate(context);

        String content = llm.content();
        ChatMessage asstMsg = ChatMessage.builder()
                .conversation(conv)
                .role(ChatRole.ASSISTANT)
                .content(content)
                .modelUsed(llm.provider() + ":" + llm.model())
                .createdAt(LocalDateTime.now())
                .build();
        msgRepo.save(asstMsg);

        conv.setUpdatedAt(LocalDateTime.now());
        convRepo.save(conv);

        return ChatResponseDto.builder()
                .conversationId(conv.getId())
                .message(toMsgDto(asstMsg))
                .provider(llm.provider())
                .model(llm.model())
                .build();
    }

    private ChatConversation createConversation(User user, String firstUserMessage) {
        // Başlık: ilk mesajın ilk 60 karakteri
        String t = firstUserMessage.trim();
        if (t.length() > 60) t = t.substring(0, 57) + "...";
        LocalDateTime now = LocalDateTime.now();
        ChatConversation c = ChatConversation.builder()
                .user(user)
                .title(t)
                .createdAt(now)
                .updatedAt(now)
                .build();
        return convRepo.save(c);
    }

    private List<Message> buildContext(ChatConversation conv, String locale) {
        List<Message> ctx = new ArrayList<>();
        ctx.add(new SystemMessage(systemPromptBuilder.build(locale)));

        // Son N mesajı (yeni→eski) çek, ters çevir, sırayla ekle
        List<ChatMessage> recent = msgRepo.findTop20ByConversation_IdOrderByCreatedAtDesc(conv.getId());
        Collections.reverse(recent);
        int from = Math.max(0, recent.size() - historyMax);
        List<ChatMessage> windowed = recent.subList(from, recent.size());

        // Persist edilmiş history'den sadece USER + final ASSISTANT text'lerini bağlama koy.
        // Önceki turdaki TOOL sonuçları ve toolCalls'lı intermediate ASSISTANT'lar burada
        // dahil edilmez — tool call'lar SADECE bu turda yeniden yapılır.
        for (ChatMessage m : windowed) {
            if (m.getRole() != ChatRole.USER && m.getRole() != ChatRole.ASSISTANT) continue;
            if (m.getContent() == null || m.getContent().isBlank()) continue;
            ctx.add(m.getRole() == ChatRole.USER
                    ? new UserMessage(m.getContent())
                    : new AssistantMessage(m.getContent()));
        }
        return ctx;
    }

    private ChatConversation requireOwned(UUID conversationId) {
        UUID userId = securityUtils.getCurrentUserId();
        ChatConversation c = convRepo.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Sohbet bulunamadı"));
        if (c.getUser() == null || !userId.equals(c.getUser().getId())) {
            throw new ResourceNotFoundException("Sohbet bulunamadı");
        }
        return c;
    }

    private ConversationDto toConvDto(ChatConversation c) {
        return ConversationDto.builder()
                .id(c.getId())
                .title(c.getTitle())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    private ChatMessageDto toMsgDto(ChatMessage m) {
        return ChatMessageDto.builder()
                .id(m.getId())
                .role(m.getRole())
                .content(m.getContent())
                .toolName(m.getToolName())
                .modelUsed(m.getModelUsed())
                .createdAt(m.getCreatedAt())
                .build();
    }
}
