package com.financeportal.domains.news.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * LibreTranslate self-hosted (docker-compose içinde) için ince HTTP istemcisi.
 * Sadece TR ↔ EN. Çevrilen metin >=5000 karakterse atlanır (LibreTranslate request limiti
 * 10000; ama haber title/description bu sınırın çok altında, fallback olarak null döner).
 * Başarısızlıkta null döner — caller fallback'i kendi yönetir (kaynak dili göster).
 */
@Component
@Slf4j
public class TranslationClient {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${external-api.libretranslate.url:http://localhost:5050}")
    private String baseUrl;

    @Value("${external-api.libretranslate.timeout-ms:8000}")
    private int timeoutMs;

    public TranslationClient(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.restTemplate = new RestTemplate();
    }

    /** TR → EN. Boş/null girdi olduğunda erken çıkar. Başarısızlıkta null. */
    public String translate(String text, String source, String target) {
        if (text == null || text.isBlank()) return null;
        if (text.length() > 5000) {
            log.debug("[TRANSLATE] Metin 5000 karakterden uzun, atlanıyor.");
            return null;
        }
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> body = Map.of(
                    "q", text,
                    "source", source,
                    "target", target,
                    "format", "text"
            );
            HttpEntity<Map<String, Object>> req = new HttpEntity<>(body, headers);

            ResponseEntity<String> resp = restTemplate.postForEntity(baseUrl + "/translate", req, String.class);
            if (resp.getBody() == null) return null;

            JsonNode node = objectMapper.readTree(resp.getBody());
            JsonNode translated = node.path("translatedText");
            return translated.isMissingNode() || translated.isNull() ? null : translated.asText();
        } catch (Exception e) {
            log.warn("[TRANSLATE] {} → {} hatası: {}", source, target, e.getMessage());
            return null;
        }
    }

    /** LibreTranslate ayakta mı? false ise sync sırasında çeviri atlanır. */
    public boolean isAvailable() {
        try {
            ResponseEntity<String> resp = restTemplate.getForEntity(baseUrl + "/languages", String.class);
            return resp.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            return false;
        }
    }
}
