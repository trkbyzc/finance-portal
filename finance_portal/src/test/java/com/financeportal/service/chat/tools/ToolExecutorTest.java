package com.financeportal.service.chat.tools;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.financeportal.service.chat.llm.LlmToolCall;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ToolExecutorTest {

    private ObjectMapper mapper;

    @BeforeEach
    void setUp() { mapper = new ObjectMapper(); }

    private ToolExecutor executorWith(ChatTool... tools) {
        return new ToolExecutor(new ChatToolRegistry(List.of(tools)), mapper);
    }

    @Test
    void basarili_calistirma_JSON_string_doner() throws Exception {
        ChatTool t = mock(ChatTool.class);
        when(t.name()).thenReturn("get_x");
        when(t.execute(any())).thenReturn(Map.of("hello", "world"));

        ToolExecutor exec = executorWith(t);
        String json = exec.execute(LlmToolCall.builder()
                .id("c1").name("get_x").argumentsJson("{}").build());

        assertEquals("world", mapper.readTree(json).path("hello").asText());
    }

    @Test
    void bilinmeyen_tool_error_field_doner() throws Exception {
        ToolExecutor exec = executorWith();
        String json = exec.execute(LlmToolCall.builder()
                .name("yok_boyle_tool").argumentsJson("{}").build());
        assertTrue(mapper.readTree(json).has("error"));
    }

    @Test
    void tool_exception_atarsa_error_field_doner() throws Exception {
        ChatTool t = mock(ChatTool.class);
        when(t.name()).thenReturn("get_y");
        when(t.execute(any())).thenThrow(new RuntimeException("boom"));

        ToolExecutor exec = executorWith(t);
        String json = exec.execute(LlmToolCall.builder()
                .name("get_y").argumentsJson("{}").build());
        assertTrue(mapper.readTree(json).path("error").asText().contains("boom"));
    }

    @Test
    void bos_argumentsJson_kabul_eder() {
        ChatTool t = mock(ChatTool.class);
        when(t.name()).thenReturn("get_z");
        when(t.execute(any())).thenReturn(Map.of("ok", true));

        ToolExecutor exec = executorWith(t);
        // null + boş JSON ikisi de problem olmamalı
        assertNotNull(exec.execute(LlmToolCall.builder().name("get_z").argumentsJson(null).build()));
        assertNotNull(exec.execute(LlmToolCall.builder().name("get_z").argumentsJson("").build()));
        assertNotNull(exec.execute(LlmToolCall.builder().name("get_z").argumentsJson("invalid-json").build()));
    }
}
