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
import com.financeportal.service.chat.llm.LlmGateway;
import com.financeportal.service.chat.llm.LlmMessage;
import com.financeportal.service.chat.llm.LlmRequest;
import com.financeportal.service.chat.llm.LlmResponse;
import com.financeportal.service.chat.llm.LlmToolCall;
import com.financeportal.service.chat.tools.ChatToolRegistry;
import com.financeportal.service.chat.tools.ToolExecutor;
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
    private final LlmGateway llmGateway;
    private final SystemPromptBuilder systemPromptBuilder;
    private final ChatToolRegistry toolRegistry;
    private final ToolExecutor toolExecutor;

    @Value("${app.chat.history-max:20}")
    private int historyMax;

    @Value("${app.limits.max-tool-iterations:5}")
    private int maxToolIterations = 5;

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

        // 2) Geçmişten LLM context'ini kur — buna multi-turn'de tool sonuçları da eklenir
        List<LlmMessage> context = buildContext(conv, req.getLocale());

        // 3) Multi-turn tool execution loop:
        //    LLM çağrısı yap → tool_calls varsa execute et, sonuçları context'e ekle ve tekrar çağır.
        //    Final assistant text yanıtı gelene kadar veya MAX_TOOL_ITERATIONS dolana kadar.
        LlmResponse llm = null;
        for (int iter = 0; iter < maxToolIterations; iter++) {
            try {
                llm = llmGateway.generate(LlmRequest.builder()
                        .messages(context)
                        .tools(toolRegistry.asLlmTools())
                        .temperature(0.5)
                        .maxTokens(1024)
                        .build());
            } catch (RuntimeException e) {
                log.error("[CHAT] LLM çağrısı tamamen başarısız: {}", e.getMessage());
                throw e;
            }

            List<LlmToolCall> calls = llm.getToolCalls();
            if (calls == null || calls.isEmpty()) {
                break;
            }

            // Assistant'ın tool-call mesajını context'e ekle (LLM bunu bekler)
            context.add(LlmMessage.builder()
                    .role(ChatRole.ASSISTANT)
                    .content(llm.getContent() != null ? llm.getContent() : "")
                    .toolCalls(calls)
                    .build());

            for (LlmToolCall call : calls) {
                String resultJson = toolExecutor.execute(call);
                LocalDateTime ts = LocalDateTime.now();
                msgRepo.save(ChatMessage.builder()
                        .conversation(conv)
                        .role(ChatRole.TOOL)
                        .content(resultJson)
                        .toolName(call.getName())
                        .createdAt(ts)
                        .build());
                context.add(LlmMessage.builder()
                        .role(ChatRole.TOOL)
                        .content(resultJson)
                        .toolName(call.getName())
                        .toolCallId(call.getId())
                        .build());
            }
            log.debug("[CHAT] iter {}: {} tool call executed", iter, calls.size());
        }

        if (llm == null) {
            throw new IllegalStateException("LLM yanıt vermedi");
        }

        String content = llm.getContent() != null ? llm.getContent() : "";
        ChatMessage asstMsg = ChatMessage.builder()
                .conversation(conv)
                .role(ChatRole.ASSISTANT)
                .content(content)
                .modelUsed(llm.getProvider() + ":" + llm.getModel())
                .createdAt(LocalDateTime.now())
                .build();
        msgRepo.save(asstMsg);

        conv.setUpdatedAt(LocalDateTime.now());
        convRepo.save(conv);

        return ChatResponseDto.builder()
                .conversationId(conv.getId())
                .message(toMsgDto(asstMsg))
                .provider(llm.getProvider())
                .model(llm.getModel())
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

    private List<LlmMessage> buildContext(ChatConversation conv, String locale) {
        List<LlmMessage> ctx = new ArrayList<>();
        ctx.add(LlmMessage.builder()
                .role(ChatRole.SYSTEM)
                .content(systemPromptBuilder.build(locale))
                .build());

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
            ctx.add(LlmMessage.builder()
                    .role(m.getRole())
                    .content(m.getContent())
                    .build());
        }
        return new ArrayList<>(ctx); // mutable — multi-turn loop'unda eklemeler yapılacak
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
