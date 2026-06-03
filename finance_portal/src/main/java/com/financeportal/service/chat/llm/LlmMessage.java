package com.financeportal.service.chat.llm;

import com.financeportal.model.enums.ChatRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Provider'dan bağımsız bir chat mesajı.
 * Hem Groq (OpenAI uyumlu) hem Gemini formatına bu sınıftan dönüştürürüz.
 *
 * - role=USER/ASSISTANT/SYSTEM: content dolu
 * - role=ASSISTANT + toolCalls: assistant'ın çağırmak istediği tool'lar (Phase 2)
 * - role=TOOL: bir tool çağrısının sonucu — toolCallId ve toolName dolu olur
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LlmMessage {
    private ChatRole role;
    private String content;
    private List<LlmToolCall> toolCalls;   // ASSISTANT için
    private String toolCallId;             // TOOL için — hangi assistant tool-call'una yanıt
    private String toolName;               // TOOL için
}
