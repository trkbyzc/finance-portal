package com.financeportal.service.chat.tools;

import com.financeportal.service.chat.llm.LlmTool;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class ChatToolRegistryTest {

    static class FakeTool implements ChatTool {
        private final String name;
        FakeTool(String name) { this.name = name; }
        @Override public String name() { return name; }
        @Override public String description() { return "desc-" + name; }
        @Override public Map<String, Object> parametersJsonSchema() {
            return Map.of("type", "object");
        }
        @Override public Object execute(Map<String, Object> args) { return Map.of("ok", true); }
    }

    @Test
    void asLlmTools_tum_toollari_dondurur() {
        ChatToolRegistry reg = new ChatToolRegistry(List.of(
                new FakeTool("a"), new FakeTool("b")
        ));
        List<LlmTool> tools = reg.asLlmTools();
        assertEquals(2, tools.size());
        assertEquals("a", tools.get(0).getName());
        assertEquals("b", tools.get(1).getName());
    }

    @Test
    void find_kayitli_tool_donsun() {
        ChatToolRegistry reg = new ChatToolRegistry(List.of(new FakeTool("x")));
        Optional<ChatTool> t = reg.find("x");
        assertTrue(t.isPresent());
        assertEquals("x", t.get().name());
    }

    @Test
    void find_olmayan_tool_empty() {
        ChatToolRegistry reg = new ChatToolRegistry(List.of(new FakeTool("x")));
        assertTrue(reg.find("y").isEmpty());
    }
}
