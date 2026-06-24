package com.financeportal.service.chat.llm;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Provider'dan bağımsız tool tanımı.
 * parametersJsonSchema: argümanların JSON Schema gösterimi — OpenAI ve Gemini her ikisi de bu formatı bekler.
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
