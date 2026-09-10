package com.financeportal.model.enums;

/**
 * Chat mesajının kim tarafından yazıldığını gösterir.
 * SYSTEM: prompt'a inject edilen sistem talimatları
 * USER:    kullanıcının yazdığı mesaj
 * ASSISTANT: LLM'in yanıtı
 * TOOL:    bir tool çağrısının sonucu (LLM'e geri verilen veri)
 */
public enum ChatRole {
    SYSTEM,
    USER,
    ASSISTANT,
    TOOL
}
