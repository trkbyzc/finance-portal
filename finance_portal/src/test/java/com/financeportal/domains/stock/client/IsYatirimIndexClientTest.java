package com.financeportal.domains.stock.client;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class IsYatirimIndexClientTest {

    @Mock private RestTemplate restTemplate;

    @InjectMocks private IsYatirimIndexClient client;

    private String html(String tbodyContent) {
        return "<html><body><table><tbody id=\"temelTBody_Ozet\">" +
                tbodyContent +
                "</tbody></table></body></html>";
    }

    @Test
    void fetch_unknownIndex_returnsEmpty() {
        Set<String> result = client.fetchIndex("XU500");

        assertTrue(result.isEmpty());
        verify(restTemplate, never()).exchange(anyString(), any(HttpMethod.class), any(HttpEntity.class), eq(String.class));
    }

    @Test
    void fetch_validHtml_returnsParsedSymbols() {
        String html = html(
                "<tr><td><a href=\"?hisse=AKBNK\">AKBNK</a></td></tr>" +
                "<tr><td><a href=\"?hisse=GARAN\">GARAN</a></td></tr>" +
                "<tr><td><a href=\"?hisse=THYAO\">THYAO</a></td></tr>");
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok(html));

        Set<String> result = client.fetchIndex("XU030");

        assertEquals(3, result.size());
        assertTrue(result.contains("AKBNK"));
        assertTrue(result.contains("GARAN"));
        assertTrue(result.contains("THYAO"));
    }

    @Test
    void fetch_xu100_usesCode01() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok(html("<a href=\"?hisse=AKBNK\">AKBNK</a>")));

        client.fetchIndex("XU100");

        // URL contains endeks=01
        verify(restTemplate).exchange(contains("endeks=01"), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class));
    }

    @Test
    void fetch_xu050_usesCode05() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok(html("<a href=\"?hisse=AKBNK\">AKBNK</a>")));

        client.fetchIndex("XU050");

        verify(restTemplate).exchange(contains("endeks=05"), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class));
    }

    @Test
    void fetch_emptyResponse_returnsEmpty() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok(""));

        assertTrue(client.fetchIndex("XU030").isEmpty());
    }

    @Test
    void fetch_nullBody_returnsEmpty() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok().build());

        assertTrue(client.fetchIndex("XU030").isEmpty());
    }

    @Test
    void fetch_noTbody_returnsEmpty() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok("<html><body>No table</body></html>"));

        assertTrue(client.fetchIndex("XU030").isEmpty());
    }

    @Test
    void fetch_tbodyButNoSymbols_returnsEmpty() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok(html("<tr><td>nothing here</td></tr>")));

        assertTrue(client.fetchIndex("XU030").isEmpty());
    }

    @Test
    void fetch_apiThrows_returnsEmpty() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenThrow(new RuntimeException("503"));

        assertTrue(client.fetchIndex("XU030").isEmpty());
    }

    @Test
    void fetch_duplicateSymbols_dedupedByLinkedHashSet() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok(html(
                        "<a href=\"?hisse=AKBNK\">A1</a><a href=\"?hisse=AKBNK\">A2</a>")));

        Set<String> result = client.fetchIndex("XU030");
        assertEquals(1, result.size());
    }
}
