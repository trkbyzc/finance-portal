package com.financeportal.service.chat.llm;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.financeportal.model.enums.ChatRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class GroqClientTest {

    private RestTemplate restTemplate;
    private GroqClient client;
    private ObjectMapper mapper;

    @BeforeEach
    void setUp() {
        restTemplate = mock(RestTemplate.class);
        mapper = new ObjectMapper();
        client = new GroqClient(restTemplate, mapper,
                "https://api.groq.com/openai/v1",
                "llama-3.3-70b-versatile",
                "test-api-key");
    }

    @Test
    void isConfigured_apikey_dolu_olunca_true() {
        assertTrue(client.isConfigured());
    }

    @Test
    void isConfigured_apikey_bos_olunca_false() {
        GroqClient empty = new GroqClient(restTemplate, mapper,
                "https://api.groq.com/openai/v1", "model", "");
        assertFalse(empty.isConfigured());
    }

    @Test
    void request_body_system_ve_user_mesaji_dogru_format() throws Exception {
        when(restTemplate.exchange(any(String.class), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok("""
                        {"choices":[{"message":{"role":"assistant","content":"hi"},"finish_reason":"stop"}]}
                        """));

        client.generate(LlmRequest.builder()
                .messages(List.of(
                        LlmMessage.builder().role(ChatRole.SYSTEM).content("sys").build(),
                        LlmMessage.builder().role(ChatRole.USER).content("hello").build()
                ))
                .temperature(0.5)
                .maxTokens(256)
                .build());

        ArgumentCaptor<HttpEntity<String>> cap = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).exchange(any(String.class), eq(HttpMethod.POST), cap.capture(), eq(String.class));

        JsonNode body = mapper.readTree(cap.getValue().getBody());
        assertEquals("llama-3.3-70b-versatile", body.path("model").asText());
        assertEquals(0.5, body.path("temperature").asDouble());
        assertEquals(256, body.path("max_tokens").asInt());
        assertEquals("system", body.path("messages").get(0).path("role").asText());
        assertEquals("sys", body.path("messages").get(0).path("content").asText());
        assertEquals("user", body.path("messages").get(1).path("role").asText());

        // Bearer header
        assertTrue(cap.getValue().getHeaders().getFirst("Authorization").startsWith("Bearer "));
    }

    @Test
    void response_parse_basic() {
        when(restTemplate.exchange(any(String.class), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok("""
                        {"choices":[{"message":{"role":"assistant","content":"merhaba"},"finish_reason":"stop"}]}
                        """));

        LlmResponse r = client.generate(LlmRequest.builder()
                .messages(List.of(LlmMessage.builder().role(ChatRole.USER).content("selam").build()))
                .build());

        assertEquals("merhaba", r.getContent());
        assertEquals("groq", r.getProvider());
        assertEquals("stop", r.getFinishReason());
        assertNotNull(r.getToolCalls());
        assertTrue(r.getToolCalls().isEmpty());
    }

    @Test
    void response_parse_tool_calls() {
        when(restTemplate.exchange(any(String.class), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok("""
                        {"choices":[{"message":{"role":"assistant","content":null,
                          "tool_calls":[
                            {"id":"call_1","type":"function","function":{"name":"get_my_portfolio","arguments":"{}"}}
                          ]},
                          "finish_reason":"tool_calls"}]}
                        """));

        LlmResponse r = client.generate(LlmRequest.builder()
                .messages(List.of(LlmMessage.builder().role(ChatRole.USER).content("x").build()))
                .build());

        assertEquals(1, r.getToolCalls().size());
        assertEquals("get_my_portfolio", r.getToolCalls().get(0).getName());
        assertEquals("call_1", r.getToolCalls().get(0).getId());
        assertEquals("tool_calls", r.getFinishReason());
    }

    @Test
    void rate_limit_429_retriable() {
        when(restTemplate.exchange(any(String.class), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenThrow(HttpClientErrorException.create(HttpStatus.TOO_MANY_REQUESTS, "rl", null, null, null));

        LlmException ex = assertThrows(LlmException.class, () ->
                client.generate(LlmRequest.builder()
                        .messages(List.of(LlmMessage.builder().role(ChatRole.USER).content("x").build()))
                        .build()));
        assertTrue(ex.isRetriable());
        assertEquals(429, ex.getStatusCode());
    }

    @Test
    void auth_error_401_non_retriable() {
        when(restTemplate.exchange(any(String.class), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenThrow(HttpClientErrorException.create(HttpStatus.UNAUTHORIZED, "no", null, null, null));

        LlmException ex = assertThrows(LlmException.class, () ->
                client.generate(LlmRequest.builder()
                        .messages(List.of(LlmMessage.builder().role(ChatRole.USER).content("x").build()))
                        .build()));
        assertFalse(ex.isRetriable());
    }

    @Test
    void server_error_5xx_retriable() {
        when(restTemplate.exchange(any(String.class), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenThrow(HttpServerErrorException.create(HttpStatus.INTERNAL_SERVER_ERROR, "boom", null, null, null));

        LlmException ex = assertThrows(LlmException.class, () ->
                client.generate(LlmRequest.builder()
                        .messages(List.of(LlmMessage.builder().role(ChatRole.USER).content("x").build()))
                        .build()));
        assertTrue(ex.isRetriable());
    }

    @Test
    void network_timeout_retriable() {
        when(restTemplate.exchange(any(String.class), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenThrow(new ResourceAccessException("timeout"));

        LlmException ex = assertThrows(LlmException.class, () ->
                client.generate(LlmRequest.builder()
                        .messages(List.of(LlmMessage.builder().role(ChatRole.USER).content("x").build()))
                        .build()));
        assertTrue(ex.isRetriable());
    }
}
