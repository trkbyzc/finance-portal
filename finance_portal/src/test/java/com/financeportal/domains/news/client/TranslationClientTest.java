package com.financeportal.domains.news.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TranslationClientTest {

    private RestTemplate restTemplate;
    private TranslationClient client;

    @BeforeEach
    void setUp() {
        restTemplate = mock(RestTemplate.class);
        client = new TranslationClient(new ObjectMapper());
        ReflectionTestUtils.setField(client, "restTemplate", restTemplate);
        ReflectionTestUtils.setField(client, "baseUrl", "http://libretranslate:5000");
        ReflectionTestUtils.setField(client, "timeoutMs", 1000);
    }

    @Test
    void translate_nullInput_returnsNull() {
        assertNull(client.translate(null, "tr", "en"));
    }

    @Test
    void translate_blankInput_returnsNull() {
        assertNull(client.translate("   ", "tr", "en"));
    }

    @Test
    void translate_tooLongInput_returnsNull() {
        String longText = "a".repeat(5001);
        assertNull(client.translate(longText, "tr", "en"));
    }

    @Test
    void translate_successfulResponse_returnsTranslation() {
        String responseJson = "{\"translatedText\":\"Stock market rose today\"}";
        when(restTemplate.postForEntity(contains("/translate"), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok(responseJson));

        String result = client.translate("Borsa bugün yükseldi", "tr", "en");

        assertEquals("Stock market rose today", result);
    }

    @Test
    void translate_nullBody_returnsNull() {
        when(restTemplate.postForEntity(contains("/translate"), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok().build());

        assertNull(client.translate("Borsa", "tr", "en"));
    }

    @Test
    void translate_missingTranslatedTextField_returnsNull() {
        when(restTemplate.postForEntity(contains("/translate"), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok("{\"error\":\"unsupported language\"}"));

        assertNull(client.translate("Borsa", "tr", "en"));
    }

    @Test
    void translate_apiThrows_returnsNull() {
        when(restTemplate.postForEntity(contains("/translate"), any(HttpEntity.class), eq(String.class)))
                .thenThrow(new RuntimeException("connection refused"));

        assertNull(client.translate("Borsa", "tr", "en"));
    }

    @Test
    void isAvailable_languagesEndpointOk_returnsTrue() {
        when(restTemplate.getForEntity(contains("/languages"), eq(String.class)))
                .thenReturn(ResponseEntity.ok("[]"));

        assertTrue(client.isAvailable());
    }

    @Test
    void isAvailable_nonSuccessStatus_returnsFalse() {
        when(restTemplate.getForEntity(contains("/languages"), eq(String.class)))
                .thenReturn(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body("down"));

        assertFalse(client.isAvailable());
    }

    @Test
    void isAvailable_apiThrows_returnsFalse() {
        when(restTemplate.getForEntity(contains("/languages"), eq(String.class)))
                .thenThrow(new RuntimeException("connection refused"));

        assertFalse(client.isAvailable());
    }
}
