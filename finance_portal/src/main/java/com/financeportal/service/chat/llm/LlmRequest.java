package com.financeportal.service.chat.llm;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * LlmGateway'e verilen tek bir generate çağrısı.
 * messages: sistem promptu + kronolojik chat geçmişi + yeni kullanıcı mesajı.
 * tools: izin verilen tool listesi (boş olabilir).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LlmRequest {
    private List<LlmMessage> messages;
    private List<LlmTool> tools;
    private Double temperature;     // null → provider default
    private Integer maxTokens;      // null → provider default
}
