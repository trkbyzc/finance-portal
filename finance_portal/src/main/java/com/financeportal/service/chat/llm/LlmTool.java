package com.financeportal.service.chat.llm;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Provider'dan bağımsız bir tool tanımı.
 * parametersJsonSchema: argümanların JSON Schema gösterimi (OpenAI/Gemini ikisi de bunu bekler).
 *
 * Phase 1'de tool listesi boş kalır; Phase 2'de gerçek tool'larla dolar.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LlmTool {
    private String name;
    private String description;
    private Map<String, Object> parametersJsonSchema;
}
