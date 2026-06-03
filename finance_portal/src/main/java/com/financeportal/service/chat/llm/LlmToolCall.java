package com.financeportal.service.chat.llm;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Bir LLM'in çağırmak istediği tool — id (provider tarafından üretilen referans),
 * tool adı ve JSON string olarak argümanlar.
 *
 * Phase 1'de henüz tool'lar wire'lı değil; bu sınıf sadece DTO olarak tanımlı —
 * Phase 2'de aktif kullanıma girer.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LlmToolCall {
    private String id;
    private String name;
    private String argumentsJson;
}
