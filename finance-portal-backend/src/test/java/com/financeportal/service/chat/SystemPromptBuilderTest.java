package com.financeportal.service.chat;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class SystemPromptBuilderTest {

    private final SystemPromptBuilder builder = new SystemPromptBuilder();

    @Test
    void tr_locale_turkce_prompt() {
        String p = builder.build("tr");
        assertTrue(p.contains("FinansPortal"));
        assertTrue(p.contains("Türkçe") || p.contains("portföy"));
        assertTrue(p.toLowerCase().contains("tool"));
    }

    @Test
    void en_locale_ingilizce_prompt() {
        String p = builder.build("en");
        assertTrue(p.contains("FinansPortal"));
        assertTrue(p.toLowerCase().contains("english") || p.contains("portfolio"));
    }

    @Test
    void null_locale_default_tr() {
        // locale boş/null → Türkçe varsayılan (kullanıcı tabanı çoğunlukla TR)
        String p = builder.build(null);
        assertTrue(p.contains("FinansPortal"));
        assertTrue(p.contains("portföy") || p.contains("Türkçe"));
    }

    @Test
    void bos_locale_default_tr() {
        String p = builder.build("");
        assertTrue(p.contains("FinansPortal"));
    }

    @Test
    void tr_BR_gibi_complex_locale_turkce_kabul() {
        String p = builder.build("tr-TR");
        assertTrue(p.contains("portföy"));
    }

    @Test
    void prompt_tool_listesi_iceriyor() {
        String tr = builder.build("tr");
        assertTrue(tr.contains("get_my_portfolio"));
        assertTrue(tr.contains("get_asset_price"));
        assertTrue(tr.contains("get_my_alarms"));
    }

    @Test
    void yatirim_tavsiyesi_yasagi_promptta_aciksa() {
        String tr = builder.build("tr");
        String en = builder.build("en");
        assertTrue(tr.toLowerCase().contains("yatırım") || tr.toLowerCase().contains("tavsiye"));
        assertTrue(en.toLowerCase().contains("invest") || en.toLowerCase().contains("advice"));
    }
}
