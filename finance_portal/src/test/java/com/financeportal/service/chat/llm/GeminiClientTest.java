package com.financeportal.service.chat.llm;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.financeportal.model.enums.ChatRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class GeminiClientTest {

    private RestTemplate restTemplate;
    private ObjectMapper mapper;

    private GeminiClient withKey(String key) {
        return new GeminiClient(restTemplate, mapper,
                "https://generativelanguage.googleapis.com/v1beta",
                "gemini-2.0-flash", key);
    }

    @BeforeEach
    void setUp() {
        restTemplate = mock(RestTemplate.class);
        mapper = new ObjectMapper();
    }

    @Test
    void legacy_key_AIza_query_param_kullanir() {
        GeminiClient client = withKey("AIza-XXX");
        when(restTemplate.exchange(any(String.class), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok("""
                        {"candidates":[{"content":{"parts":[{"text":"ok"}]},"finishReason":"STOP"}]}
                        """));

        client.generate(LlmRequest.builder()
                .messages(List.of(LlmMessage.builder().role(ChatRole.USER).content("x").build()))
                .build());

        ArgumentCaptor<String> urlCap = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<HttpEntity<String>> entCap = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).exchange(urlCap.capture(), eq(HttpMethod.POST), entCap.capture(), eq(String.class));

        assertTrue(urlCap.getValue().contains("?key=AIza-XXX"));
        assertNull(entCap.getValue().getHeaders().getFirst("Authorization"));
    }

    @Test
    void yeni_format_key_AQ_bearer_kullanir() {
        GeminiClient client = withKey("AQ.Ab8RN6test");
        when(restTemplate.exchange(any(String.class), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok("""
                        {"candidates":[{"content":{"parts":[{"text":"ok"}]},"finishReason":"STOP"}]}
                        """));

        client.generate(LlmRequest.builder()
                .messages(List.of(LlmMessage.builder().role(ChatRole.USER).content("x").build()))
                .build());

        ArgumentCaptor<String> urlCap = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<HttpEntity<String>> entCap = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).exchange(urlCap.capture(), eq(HttpMethod.POST), entCap.capture(), eq(String.class));

        assertFalse(urlCap.getValue().contains("?key="));
        assertEquals("Bearer AQ.Ab8RN6test", entCap.getValue().getHeaders().getFirst("Authorization"));
    }

    @Test
    void system_mesaji_systemInstruction_alanina_gider() throws Exception {
        GeminiClient client = withKey("AIza-XXX");
        when(restTemplate.exchange(any(String.class), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok("""
                        {"candidates":[{"content":{"parts":[{"text":"ok"}]},"finishReason":"STOP"}]}
                        """));

        client.generate(LlmRequest.builder()
                .messages(List.of(
                        LlmMessage.builder().role(ChatRole.SYSTEM).content("rules").build(),
                        LlmMessage.builder().role(ChatRole.USER).content("hi").build()
                ))
                .build());

        ArgumentCaptor<HttpEntity<String>> entCap = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).exchange(any(String.class), eq(HttpMethod.POST), entCap.capture(), eq(String.class));

        JsonNode body = mapper.readTree(entCap.getValue().getBody());
        // systemInstruction parts[0].text == "rules"
        assertEquals("rules", body.path("systemInstruction").path("parts").get(0).path("text").asText());
        // contents sadece user mesajını içermeli
        assertEquals(1, body.path("contents").size());
        assertEquals("user", body.path("contents").get(0).path("role").asText());
    }

    @Test
    void asistan_mesaji_role_model_olur() throws Exception {
        GeminiClient client = withKey("AIza-XXX");
        when(restTemplate.exchange(any(String.class), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok("""
                        {"candidates":[{"content":{"parts":[{"text":"ok"}]},"finishReason":"STOP"}]}
                        """));

        client.generate(LlmRequest.builder()
                .messages(List.of(
                        LlmMessage.builder().role(ChatRole.USER).content("hi").build(),
                        LlmMessage.builder().role(ChatRole.ASSISTANT).content("hello!").build(),
                        LlmMessage.builder().role(ChatRole.USER).content("again").build()
                ))
                .build());

        ArgumentCaptor<HttpEntity<String>> entCap = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).exchange(any(String.class), eq(HttpMethod.POST), entCap.capture(), eq(String.class));
        JsonNode body = mapper.readTree(entCap.getValue().getBody());
        assertEquals("user", body.path("contents").get(0).path("role").asText());
        assertEquals("model", body.path("contents").get(1).path("role").asText());
        assertEquals("user", body.path("contents").get(2).path("role").asText());
    }

    @Test
    void response_parse_functionCall_tool_call_yapar() {
        GeminiClient client = withKey("AIza-XXX");
        when(restTemplate.exchange(any(String.class), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok("""
                        {"candidates":[{
                          "content":{"parts":[
                            {"functionCall":{"name":"get_my_portfolio","args":{}}}
                          ]},
                          "finishReason":"STOP"
                        }]}
                        """));

        LlmResponse r = client.generate(LlmRequest.builder()
                .messages(List.of(LlmMessage.builder().role(ChatRole.USER).content("portfoyum").build()))
                .build());

        assertEquals(1, r.getToolCalls().size());
        assertEquals("get_my_portfolio", r.getToolCalls().get(0).getName());
        assertEquals("tool_calls", r.getFinishReason()); // normalized
    }

    @Test
    void apikey_legacy_format_detect() {
        assertTrue(GeminiClient.isLegacyApiKey("AIza-something"));
        assertFalse(GeminiClient.isLegacyApiKey("AQ.Ab8..."));
        assertFalse(GeminiClient.isLegacyApiKey(""));
        assertFalse(GeminiClient.isLegacyApiKey(null));
    }
}
