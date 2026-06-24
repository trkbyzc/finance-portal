package com.financeportal.service.chat.tools;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.financeportal.service.chat.llm.LlmToolCall;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Bir LlmToolCall'ı ChatToolRegistry üzerinden çalıştırıp sonucu JSON string'e çevirir.
 * Hata durumunda: LLM'in retry yapabilmesi için {"error": "..."} JSON döner — exception fırlatmaz.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ToolExecutor {

    private final ChatToolRegistry registry;
    private final ObjectMapper objectMapper;

    /** Sonucu JSON string olarak dön — LLM'e TOOL message content'i olarak verilir. */
    public String execute(LlmToolCall call) {
        try {
            ChatTool tool = registry.find(call.getName()).orElse(null);
            if (tool == null) {
                log.warn("[CHAT/tool] Bilinmeyen tool: {}", call.getName());
                return objectMapper.writeValueAsString(
                        Map.of("error", "Bilinmeyen tool: " + call.getName()));
            }
            Map<String, Object> args = parseArgs(call.getArgumentsJson());
            Object result = tool.execute(args);
            String json = objectMapper.writeValueAsString(result);
            log.debug("[CHAT/tool] {} → {} chars", call.getName(), json.length());
            return json;
        } catch (Exception e) {
            log.warn("[CHAT/tool] {} çalıştırılırken hata: {}", call.getName(), e.getMessage());
            try {
                return objectMapper.writeValueAsString(Map.of("error", e.getMessage()));
            } catch (Exception ignored) {
                return "{\"error\":\"tool execution failed\"}";
            }
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> parseArgs(String json) {
        try {
            if (json == null || json.isBlank()) return new HashMap<>();
            return objectMapper.readValue(json, Map.class);
        } catch (Exception e) {
            // Bozuk JSON argümanı tool'u tamamen patlatmak yerine boş map ile devam ettirir;
            // tool zaten eksik argüman için kendi hatasını üretir.
            return new HashMap<>();
        }
    }
}
