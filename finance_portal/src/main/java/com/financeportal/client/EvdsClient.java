package com.financeportal.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Iterator; // 🚀 EKSİK OLAN IMPORT BURADA
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class EvdsClient {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${evds.base-url:https://evds3.tcmb.gov.tr/igmevdsms-dis}")
    private String baseUrl;

    @Value("${evds.api-key:***REMOVED***}") // application.yml'den alamazsa direkt bunu kullanır
    private String apiKey;

    private static final DateTimeFormatter EVDS_DATE_FMT = DateTimeFormatter.ofPattern("dd-MM-yyyy");

    // 🚀 Python'daki "fetch_with_retry" metodunun Java karşılığı
    public List<JsonNode> fetchSeries(List<String> seriesCodes, LocalDate startDate, LocalDate endDate, String formulas) {
        String start = startDate.format(EVDS_DATE_FMT);
        String end = endDate.format(EVDS_DATE_FMT);
        String seriesParam = String.join("-", seriesCodes); // Birden fazla kod varsa araya tire koyar

        String url = baseUrl.stripTrailing() + "/series=" + seriesParam + "&startDate=" + start + "&endDate=" + end + "&type=json";
        if (formulas != null && !formulas.isEmpty()) {
            url += "&formulas=" + formulas;
        }

        HttpHeaders headers = new HttpHeaders();
        headers.set("key", apiKey);
        headers.set(HttpHeaders.ACCEPT, "application/json");
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        int maxRetries = 3;
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
                if (response.getBody() != null) {
                    JsonNode rootNode = objectMapper.readTree(response.getBody());
                    JsonNode items = rootNode.path("items");
                    if (items.isArray()) {
                        List<JsonNode> resultList = new ArrayList<>();
                        items.forEach(resultList::add);
                        return resultList;
                    }
                }
            } catch (Exception e) {
                log.warn("[EVDS] Sunucu yanıt vermedi (Deneme {}/{}). Hata: {}", attempt, maxRetries, e.getMessage());
                if (attempt == maxRetries) {
                    log.error("[EVDS] TCMB sunucularına ulaşılamadı. Seriler: {}", seriesParam);
                } else {
                    try { Thread.sleep(5000); } catch (InterruptedException ignored) {} // Python'daki gibi 5 sn bekle
                }
            }
        }
        return new ArrayList<>();
    }

    // 🚀 AKILLI KOLON BULUCU: EVDS formül eklendiğinde kolon adını değiştirir, bu yüzden "contains" mantığı şart!
    public Double extractValueFromNode(JsonNode node, String seriesCode) {
        String baseColumnName = seriesCode.replace(".", "_");

        // 1. Önce tam eşleşme ara (Faiz ve İşsizlik için genelde bu çalışır)
        if (node.has(baseColumnName)) {
            String valStr = node.get(baseColumnName).asText();
            if (valStr != null && !valStr.isEmpty() && !valStr.equals("ND") && !valStr.equals("null")) {
                try { return Double.parseDouble(valStr); } catch (Exception ignored) {}
            }
        }

        // 2. Tam eşleşmezse, içinde baseColumnName geçen ilk kolonu bul (Enflasyon Formula=3 için)
        Iterator<String> fieldNames = node.fieldNames();
        while (fieldNames.hasNext()) {
            String fieldName = fieldNames.next();
            if (fieldName.contains(baseColumnName)) {
                String valStr = node.get(fieldName).asText();
                if (valStr != null && !valStr.isEmpty() && !valStr.equals("ND") && !valStr.equals("null")) {
                    try { return Double.parseDouble(valStr); } catch (Exception ignored) {}
                }
            }
        }

        return null;
    }
}