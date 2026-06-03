package com.financeportal.service.chat.llm;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * LlmGateway failover davranışı:
 *  - primary OK → primary'nin yanıtı döner
 *  - primary retriable throw → fallback denenir
 *  - primary non-retriable throw → fallback denenmez, hata yukarı fırlar
 *  - primary konfigüre değil → fallback denenir
 *  - hem primary hem fallback patlarsa son hata fırlar
 */
class LlmGatewayTest {

    private LlmClient client(String name, boolean configured) {
        LlmClient c = mock(LlmClient.class);
        when(c.name()).thenReturn(name);
        when(c.isConfigured()).thenReturn(configured);
        return c;
    }

    @Test
    void primary_basariliysa_fallback_denenmemeli() {
        LlmClient groq = client("groq", true);
        LlmClient gemini = client("gemini", true);
        LlmResponse ok = LlmResponse.builder().content("hello").provider("groq").build();
        when(groq.generate(any())).thenReturn(ok);

        LlmGateway gw = new LlmGateway(List.of(groq, gemini), "groq", "gemini");

        LlmResponse r = gw.generate(LlmRequest.builder().messages(List.of()).build());

        assertEquals("hello", r.getContent());
        verify(gemini, never()).generate(any());
    }

    @Test
    void primary_retriable_patlarsa_fallback_denenmeli() {
        LlmClient groq = client("groq", true);
        LlmClient gemini = client("gemini", true);
        when(groq.generate(any()))
                .thenThrow(new LlmException("rate limit", true, 429));
        when(gemini.generate(any()))
                .thenReturn(LlmResponse.builder().content("from-gemini").provider("gemini").build());

        LlmGateway gw = new LlmGateway(List.of(groq, gemini), "groq", "gemini");

        LlmResponse r = gw.generate(LlmRequest.builder().messages(List.of()).build());

        assertEquals("from-gemini", r.getContent());
        verify(gemini, times(1)).generate(any());
    }

    @Test
    void primary_non_retriable_patlarsa_fallback_denenmemeli() {
        LlmClient groq = client("groq", true);
        LlmClient gemini = client("gemini", true);
        when(groq.generate(any()))
                .thenThrow(new LlmException("auth failed", false, 401));

        LlmGateway gw = new LlmGateway(List.of(groq, gemini), "groq", "gemini");

        LlmException ex = assertThrows(LlmException.class,
                () -> gw.generate(LlmRequest.builder().messages(List.of()).build()));
        assertFalse(ex.isRetriable());
        verify(gemini, never()).generate(any());
    }

    @Test
    void primary_konfigure_degilse_fallback_denenir() {
        LlmClient groq = client("groq", false);  // konfigüre değil
        LlmClient gemini = client("gemini", true);
        when(gemini.generate(any()))
                .thenReturn(LlmResponse.builder().content("g").provider("gemini").build());

        LlmGateway gw = new LlmGateway(List.of(groq, gemini), "groq", "gemini");

        LlmResponse r = gw.generate(LlmRequest.builder().messages(List.of()).build());

        assertEquals("g", r.getContent());
        verify(groq, never()).generate(any());
    }

    @Test
    void hem_primary_hem_fallback_patlarsa_hata_firlar() {
        LlmClient groq = client("groq", true);
        LlmClient gemini = client("gemini", true);
        when(groq.generate(any())).thenThrow(new LlmException("p", true, 503));
        when(gemini.generate(any())).thenThrow(new LlmException("f", true, 503));

        LlmGateway gw = new LlmGateway(List.of(groq, gemini), "groq", "gemini");

        assertThrows(LlmException.class,
                () -> gw.generate(LlmRequest.builder().messages(List.of()).build()));
        verify(gemini, times(1)).generate(any());
    }

    @Test
    void fallback_konfigure_degilse_primary_patlayinca_hata_firlar() {
        LlmClient groq = client("groq", true);
        LlmClient gemini = client("gemini", false);  // fallback yok
        when(groq.generate(any())).thenThrow(new LlmException("p", true, 503));

        LlmGateway gw = new LlmGateway(List.of(groq, gemini), "groq", "gemini");

        assertThrows(LlmException.class,
                () -> gw.generate(LlmRequest.builder().messages(List.of()).build()));
        verify(gemini, never()).generate(any());
    }

    @Test
    void unknown_primary_isim_throws() {
        LlmClient gemini = client("gemini", true);
        LlmGateway gw = new LlmGateway(List.of(gemini), "groq", "gemini");

        assertThrows(LlmException.class,
                () -> gw.generate(LlmRequest.builder().messages(List.of()).build()));
    }
}
