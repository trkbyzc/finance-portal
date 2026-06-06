package com.financeportal.domains.news.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * Lingva Translate self-hosted (docker-compose içinde) için ince HTTP istemcisi.
 * Sadece TR ↔ EN. Lingva Google Translate ön yüzüdür: hızlı, ücretsiz, API key gerekmez.
 * <p>
 * API: {@code GET /api/v1/{source}/{target}/{url-encoded-text}} → {@code {"translation": "..."}}
 * <p>
 * Başarısızlıkta null döner — caller fallback'i kendi yönetir (kaynak dili göster).
 * Önceki LibreTranslate sürümü CPU-only Docker'da çağrı başı 10-30sn alıyordu; Lingva
 * Google'ı arkadan kullandığı için ~200-500ms.
 */
@Component
@Slf4j
public class TranslationClient {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${external-api.lingva.url:http://localhost:5050}")
    private String baseUrl;

    @Value("${external-api.lingva.timeout-ms:15000}")
    private int timeoutMs;

    public TranslationClient(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.restTemplate = new RestTemplate();
    }

    /**
     * Timeout'suz RestTemplate, downstream yanıt vermezse sonsuza kadar bekliyor (ve
     * NewsSync isAvailable() poll'ü startup'ta kilitleyebiliyor). Connect/read timeout zorunlu.
     */
    @PostConstruct
    void configureTimeouts() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5_000);
        factory.setReadTimeout(timeoutMs);
        restTemplate.setRequestFactory(factory);
    }

    /**
     * Lingva GET path-segment olarak text alır; Türkçe UTF-8 karakterleri URI-encoded'da
     * 6x büyür (1 char → %XX%XX). Server URL limiti ~8KB → Türkçe için güvenli üst sınır
     * ~2500 char (URL ~7.4KB). Daha uzunsa caller {@code NewsService.translateLongText}
     * ile chunk'lar.
     */
    private static final int MAX_TEXT_LENGTH = 2500;

    /** TR → EN. Boş/null girdi olduğunda erken çıkar. Başarısızlıkta null. */
    public String translate(String text, String source, String target) {
        if (text == null || text.isBlank()) return null;
        if (text.length() > MAX_TEXT_LENGTH) {
            log.debug("[TRANSLATE] Metin {} karakterden uzun, atlanıyor.", MAX_TEXT_LENGTH);
            return null;
        }
        URI uri;
        try {
            // UriComponentsBuilder.pathSegment '.' / ':' gibi karakterleri encode etmiyor;
            // Lingva backend bazı text'lerde 404 dönüyor. URLEncoder ile manuel encode
            // (urllib.parse.quote ile aynı davranış). Space için '+' yerine '%20'.
            String encoded = URLEncoder.encode(text, StandardCharsets.UTF_8).replace("+", "%20");
            uri = URI.create(baseUrl + "/api/v1/" + source + "/" + target + "/" + encoded);
        } catch (Exception e) {
            log.warn("[TRANSLATE] URI build hatası ({} chars): {}", text.length(), e.getMessage());
            return null;
        }
        try {
            ResponseEntity<String> resp = restTemplate.getForEntity(uri, String.class);
            if (resp.getBody() == null) {
                log.warn("[TRANSLATE] Empty body, status={}", resp.getStatusCode());
                return null;
            }

            JsonNode node = objectMapper.readTree(resp.getBody());
            JsonNode translated = node.path("translation");
            if (translated.isMissingNode() || translated.isNull()) {
                log.warn("[TRANSLATE] No 'translation' field in response (len={}): {}",
                        resp.getBody().length(), resp.getBody().substring(0, Math.min(200, resp.getBody().length())));
                return null;
            }
            return translated.asText();
        } catch (Exception e) {
            log.warn("[TRANSLATE] {} → {} hatası ({} chars): {} — {}",
                    source, target, text.length(), e.getClass().getSimpleName(), e.getMessage());
            return null;
        }
    }

    /** Lingva ayakta mı? Sağlık kontrolü kısa bir çeviri ile (Lingva'da /health endpoint yok). */
    public boolean isAvailable() {
        try {
            URI uri = URI.create(baseUrl + "/api/v1/tr/en/test");
            ResponseEntity<String> resp = restTemplate.getForEntity(uri, String.class);
            return resp.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            return false;
        }
    }
}
