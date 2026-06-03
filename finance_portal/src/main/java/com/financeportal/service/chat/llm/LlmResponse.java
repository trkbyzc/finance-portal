package com.financeportal.service.chat.llm;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * LlmGateway'in döndürdüğü cevap.
 * content: assistant'ın text yanıtı (null/boş olabilir — tool çağrısı varsa)
 * toolCalls: assistant'ın çağırmak istediği tool'lar (Phase 2'de işlenir)
 * provider/model: hangi provider/model'in ürettiği (audit + UI gösterimi)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LlmResponse {
    private String content;
    private List<LlmToolCall> toolCalls;
    private String provider;
    private String model;
    private String finishReason;       // stop | tool_calls | length
}
