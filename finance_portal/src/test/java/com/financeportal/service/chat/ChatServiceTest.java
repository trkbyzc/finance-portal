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
import com.financeportal.service.chat.llm.LlmGateway;
import com.financeportal.service.chat.llm.LlmRequest;
import com.financeportal.service.chat.llm.LlmResponse;
import com.financeportal.service.chat.llm.LlmToolCall;
import com.financeportal.service.chat.tools.ChatToolRegistry;
import com.financeportal.service.chat.tools.ToolExecutor;
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
    @Mock private LlmGateway llmGateway;
    @Mock private SystemPromptBuilder systemPromptBuilder;
    @Mock private ChatToolRegistry toolRegistry;
    @Mock private ToolExecutor toolExecutor;

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
        when(toolRegistry.asLlmTools()).thenReturn(Collections.emptyList());
    }

    @Test
    void send_yeni_konusma_acar_ve_iki_mesaji_persist_eder() {
        when(llmGateway.generate(any()))
                .thenReturn(LlmResponse.builder()
                        .content("merhaba!")
                        .provider("groq").model("llama-3.3-70b-versatile")
                        .finishReason("stop")
                        .toolCalls(Collections.emptyList())
                        .build());

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
                .thenReturn(LlmResponse.builder()
                        .content("OK").provider("groq").model("m").toolCalls(Collections.emptyList())
                        .build());

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
                .thenReturn(LlmResponse.builder()
                        .content("hi").provider("groq").model("m").toolCalls(Collections.emptyList())
                        .build());

        chatService.sendMessage(ChatRequestDto.builder().message("hello").locale("en").build());

        ArgumentCaptor<LlmRequest> reqCap = ArgumentCaptor.forClass(LlmRequest.class);
        verify(llmGateway).generate(reqCap.capture());
        LlmRequest sent = reqCap.getValue();
        assertEquals(ChatRole.SYSTEM, sent.getMessages().get(0).getRole());
        assertEquals("SYS-PROMPT", sent.getMessages().get(0).getContent());
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

    @Test
    void tool_call_geldiyse_executor_calistirilir_ve_ikinci_LLM_turu_yapilir() {
        when(toolRegistry.asLlmTools()).thenReturn(Collections.emptyList());
        when(toolExecutor.execute(any())).thenReturn("{\"count\":3}");

        // Tur 1: tool_calls dön, Tur 2: text yanıt
        when(llmGateway.generate(any()))
                .thenReturn(LlmResponse.builder()
                        .toolCalls(List.of(LlmToolCall.builder()
                                .id("tc1").name("get_my_portfolio").argumentsJson("{}").build()))
                        .finishReason("tool_calls")
                        .provider("groq").model("m")
                        .build())
                .thenReturn(LlmResponse.builder()
                        .content("Portföyünde 3 varlık var.")
                        .toolCalls(Collections.emptyList())
                        .finishReason("stop")
                        .provider("groq").model("m")
                        .build());

        ChatResponseDto r = chatService.sendMessage(
                ChatRequestDto.builder().message("portföyüm").locale("tr").build());

        assertEquals("Portföyünde 3 varlık var.", r.getMessage().getContent());
        verify(llmGateway, times(2)).generate(any());
        verify(toolExecutor, times(1)).execute(any());
        // USER + TOOL + final ASSISTANT = 3 persist
        verify(msgRepo, times(3)).save(any());
    }

    @Test
    void max_iter_dolarsa_sonsuz_loop_olmaz() {
        when(toolRegistry.asLlmTools()).thenReturn(Collections.emptyList());
        when(toolExecutor.execute(any())).thenReturn("{}");

        // Her seferinde tool_call dön — sonsuza kadar değil, max iter ile sınırlı kal
        when(llmGateway.generate(any())).thenReturn(LlmResponse.builder()
                .toolCalls(List.of(LlmToolCall.builder()
                        .id("x").name("get_my_portfolio").argumentsJson("{}").build()))
                .finishReason("tool_calls")
                .provider("groq").model("m")
                .content("")
                .build());

        // Hata fırlatmaz, son içeriği boş da olsa kullanır
        chatService.sendMessage(ChatRequestDto.builder().message("loop").locale("tr").build());

        // MAX_TOOL_ITERATIONS=5 → 5 LLM çağrısı + 5 tool execution
        verify(llmGateway, times(5)).generate(any());
        verify(toolExecutor, times(5)).execute(any());
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
