package com.financeportal.service.chat.tools;

import com.financeportal.service.chat.llm.LlmTool;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Spring autowire'lı tüm ChatTool bean'lerini ada göre indeksler.
 * LLM çağrılarına geçirilecek LlmTool listesini sunar; ToolExecutor isimle tool çağırır.
 */
@Component
@Slf4j
public class ChatToolRegistry {

    private final Map<String, ChatTool> byName = new HashMap<>();
    private final List<ChatTool> tools;

    public ChatToolRegistry(List<ChatTool> tools) {
        this.tools = tools;
        for (ChatTool t : tools) byName.put(t.name(), t);
    }

    @PostConstruct
    void logSetup() {
        log.info("[CHAT] Tool registry: {} tool kayıtlı: {}",
                byName.size(), byName.keySet());
    }

    public List<LlmTool> asLlmTools() {
        return tools.stream().map(ChatTool::toLlmTool).toList();
    }

    public Optional<ChatTool> find(String name) {
        return Optional.ofNullable(byName.get(name));
    }
}
