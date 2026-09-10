package com.financeportal.service.chat;

import com.financeportal.exception.ResourceNotFoundException;
import com.financeportal.model.dto.chat.ChatMessageDto;
import com.financeportal.model.dto.chat.ChatRequestDto;
import com.financeportal.model.dto.chat.ChatResponseDto;
import com.financeportal.model.entity.ChatConversation;
import com.financeportal.model.entity.ChatMessage;
import com.financeportal.model.entity.User;
import com.financeportal.model.enums.ChatRole;
import com.financeportal.repository.ChatConversationRepository;
import com.financeportal.repository.ChatMessageRepository;
import com.financeportal.repository.UserRepository;
import com.financeportal.security.SecurityUtils;
import com.financeportal.service.chat.llm.LlmProviderGateway;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ChatServiceTest {

    @Mock private ChatConversationRepository convRepo;
    @Mock private ChatMessageRepository msgRepo;
    @Mock private UserRepository userRepo;
    @Mock private SecurityUtils securityUtils;
    @Mock private LlmProviderGateway llmGateway;
    @Mock private SystemPromptBuilder systemPromptBuilder;

    @InjectMocks private ChatService chatService;

    private UUID userId;
    private User user;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        user = new User();
        user.setId(userId);
        user.setUsername("alice");
        ReflectionTestUtils.setField(chatService, "historyMax", 20);
        when(securityUtils.getCurrentUserId()).thenReturn(userId);
        when(userRepo.findById(userId)).thenReturn(Optional.of(user));
        when(systemPromptBuilder.build(any())).thenReturn("SYS-PROMPT");
        when(convRepo.save(any())).thenAnswer(inv -> {
            ChatConversation c = inv.getArgument(0);
            if (c.getId() == null) c.setId(UUID.randomUUID());
            return c;
        });
        when(msgRepo.save(any())).thenAnswer(inv -> {
            ChatMessage m = inv.getArgument(0);
            if (m.getId() == null) m.setId(UUID.randomUUID());
            return m;
        });
        when(msgRepo.findTop20ByConversation_IdOrderByCreatedAtDesc(any()))
                .thenReturn(new ArrayList<>());
    }

    @Test
    void send_yeni_konusma_acar_ve_iki_mesaji_persist_eder() {
        when(llmGateway.generate(any()))
                .thenReturn(new LlmProviderGateway.LlmResult("merhaba!", "groq", "llama-3.3-70b-versatile"));

        ChatResponseDto r = chatService.sendMessage(
                ChatRequestDto.builder().message("selam").locale("tr").build());

        assertNotNull(r.getConversationId());
        assertEquals("merhaba!", r.getMessage().getContent());
        assertEquals("groq", r.getProvider());

        // 2 mesaj save edildi (USER + ASSISTANT)
        ArgumentCaptor<ChatMessage> msgCap = ArgumentCaptor.forClass(ChatMessage.class);
        verify(msgRepo, times(2)).save(msgCap.capture());
        assertEquals(ChatRole.USER, msgCap.getAllValues().get(0).getRole());
        assertEquals(ChatRole.ASSISTANT, msgCap.getAllValues().get(1).getRole());
    }

    @Test
    void send_mevcut_konusmaya_ekler() {
        UUID convId = UUID.randomUUID();
        ChatConversation existing = ChatConversation.builder()
                .id(convId).user(user).title("eski").createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now())
                .build();
        when(convRepo.findById(convId)).thenReturn(Optional.of(existing));
        when(llmGateway.generate(any()))
                .thenReturn(new LlmProviderGateway.LlmResult("OK", "groq", "m"));

        ChatResponseDto r = chatService.sendMessage(
                ChatRequestDto.builder().conversationId(convId).message("yeni").locale("tr").build());

        assertEquals(convId, r.getConversationId());
    }

    @Test
    void send_baskasinin_konusmasini_acmaz() {
        UUID convId = UUID.randomUUID();
        User other = new User();
        other.setId(UUID.randomUUID());
        ChatConversation foreign = ChatConversation.builder()
                .id(convId).user(other).title("x").createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now())
                .build();
        when(convRepo.findById(convId)).thenReturn(Optional.of(foreign));

        assertThrows(ResourceNotFoundException.class, () ->
                chatService.sendMessage(ChatRequestDto.builder()
                        .conversationId(convId).message("hack").locale("tr").build()));

        verify(llmGateway, never()).generate(any());
    }

    @Test
    void bos_mesaj_kabul_etmez() {
        assertThrows(IllegalArgumentException.class, () ->
                chatService.sendMessage(ChatRequestDto.builder().message("   ").locale("tr").build()));
        verify(llmGateway, never()).generate(any());
    }

    @Test
    void system_prompt_LLM_request_ilk_mesaj_olarak_gider() {
        when(llmGateway.generate(any()))
                .thenReturn(new LlmProviderGateway.LlmResult("hi", "groq", "m"));

        chatService.sendMessage(ChatRequestDto.builder().message("hello").locale("en").build());

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Message>> reqCap = ArgumentCaptor.forClass(List.class);
        verify(llmGateway).generate(reqCap.capture());
        List<Message> sent = reqCap.getValue();
        assertInstanceOf(SystemMessage.class, sent.get(0));
        assertEquals("SYS-PROMPT", sent.get(0).getText());
    }

    @Test
    void listMyConversations_user_id_filtreliyor() {
        when(convRepo.findByUser_IdOrderByUpdatedAtDesc(userId)).thenReturn(List.of(
                ChatConversation.builder().id(UUID.randomUUID()).user(user).title("a")
                        .createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now()).build()
        ));
        assertEquals(1, chatService.listMyConversations().size());
    }

    @Test
    void getMessages_baskasinin_konusmasi_404() {
        UUID convId = UUID.randomUUID();
        User other = new User();
        other.setId(UUID.randomUUID());
        ChatConversation foreign = ChatConversation.builder()
                .id(convId).user(other).title("x").createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now())
                .build();
        when(convRepo.findById(convId)).thenReturn(Optional.of(foreign));

        assertThrows(ResourceNotFoundException.class, () -> chatService.getMessages(convId));
    }

    /**
     * Cok turlu arac dongusunu olcen iki test kaldirildi: o dongu artik ChatService'te
     * degil, Spring AI'nin icinde. Model bir arac istediginde framework onu calistirip
     * sonucu modele geri veriyor ve nihai metin gelene kadar yineliyor.
     *
     * Yerine servisin KENDI sorumlulugu olan sey olculuyor: saglayici tek cagriyla
     * konusuyor ve donen metin kaydediliyor.
     */
    @Test
    void arac_dongusu_artik_frameworke_ait_tek_cagri_yapilir() {
        when(llmGateway.generate(any()))
                .thenReturn(new LlmProviderGateway.LlmResult("Portföyünde 3 varlık var.", "gemini", "gemini-2.5-flash"));

        ChatResponseDto r = chatService.sendMessage(
                ChatRequestDto.builder().message("portföyüm").locale("tr").build());

        assertEquals("Portföyünde 3 varlık var.", r.getMessage().getContent());
        assertEquals("gemini", r.getProvider());
        verify(llmGateway, times(1)).generate(any());
        // Yalnizca USER + ASSISTANT kaydedilir; ara arac sonuclari artik yazilmiyor.
        verify(msgRepo, times(2)).save(any());
    }

    @Test
    void getMessages_TOOL_mesajlarini_listede_gostermez() {
        UUID convId = UUID.randomUUID();
        ChatConversation conv = ChatConversation.builder()
                .id(convId).user(user).title("x").createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now())
                .build();
        when(convRepo.findById(convId)).thenReturn(Optional.of(conv));
        when(msgRepo.findByConversation_IdOrderByCreatedAtAsc(convId)).thenReturn(List.of(
                ChatMessage.builder().id(UUID.randomUUID()).conversation(conv).role(ChatRole.USER).content("portfoyum").createdAt(LocalDateTime.now()).build(),
                ChatMessage.builder().id(UUID.randomUUID()).conversation(conv).role(ChatRole.TOOL).content("{\"count\":3}").toolName("get_my_portfolio").createdAt(LocalDateTime.now()).build(),
                ChatMessage.builder().id(UUID.randomUUID()).conversation(conv).role(ChatRole.ASSISTANT).content("3 varlık var").createdAt(LocalDateTime.now()).build()
        ));

        List<ChatMessageDto> out = chatService.getMessages(convId);
        assertEquals(2, out.size());
        assertEquals(ChatRole.USER, out.get(0).getRole());
        assertEquals(ChatRole.ASSISTANT, out.get(1).getRole());
    }

    @Test
    void getMessages_system_mesajlari_listede_gostermez() {
        UUID convId = UUID.randomUUID();
        ChatConversation conv = ChatConversation.builder()
                .id(convId).user(user).title("x").createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now())
                .build();
        when(convRepo.findById(convId)).thenReturn(Optional.of(conv));
        when(msgRepo.findByConversation_IdOrderByCreatedAtAsc(convId)).thenReturn(List.of(
                ChatMessage.builder().id(UUID.randomUUID()).conversation(conv).role(ChatRole.SYSTEM).content("sys").createdAt(LocalDateTime.now()).build(),
                ChatMessage.builder().id(UUID.randomUUID()).conversation(conv).role(ChatRole.USER).content("hi").createdAt(LocalDateTime.now()).build(),
                ChatMessage.builder().id(UUID.randomUUID()).conversation(conv).role(ChatRole.ASSISTANT).content("yo").createdAt(LocalDateTime.now()).build()
        ));

        List<ChatMessageDto> out = chatService.getMessages(convId);
        assertEquals(2, out.size());
        assertEquals(ChatRole.USER, out.get(0).getRole());
        assertEquals(ChatRole.ASSISTANT, out.get(1).getRole());
    }
}
