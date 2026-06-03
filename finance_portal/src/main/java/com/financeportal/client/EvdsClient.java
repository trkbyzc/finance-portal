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

    /**
     * EVDS API'nin per-request hard limit'i 1000 nokta. Bu metod ham (paginated olmayan)
     * çağrı yapar — sadece <=1000 nokta dönecek aralıklar için kullan. Daha uzun aralıklar
     * için {@link #fetchSeriesPaginated} kullan.
     */
    public List<JsonNode> fetchSeries(List<String> seriesCodes, LocalDate startDate, LocalDate endDate, String formulas) {
        return fetchSeries(seriesCodes, startDate, endDate, formulas, null);
    }

    /**
     * EVDS frequency parametresi gerektiren seriler için overload.
     * Kabul edilen değerler (EVDS standardı): 1=Günlük, 2=İş günü, 3=Haftalık, 4=Çift haftalık,
     * 5=Aylık, 6=Üç aylık (çeyreklik), 7=Altı aylık, 8=Yıllık.
     *
     * Çoğu seri default frekansı doğru çıkarır; ama çeyreklik (GSYİH) ve yıllık (GDP per capita)
     * gibi düşük frekanslı serilerde EVDS bazen frequency olmadan boş dönüyor.
     */
    public List<JsonNode> fetchSeries(List<String> seriesCodes, LocalDate startDate, LocalDate endDate, String formulas, Integer frequency) {
        String start = startDate.format(EVDS_DATE_FMT);
        String end = endDate.format(EVDS_DATE_FMT);
        String seriesParam = String.join("-", seriesCodes); // Birden fazla kod varsa araya tire koyar

        String url = baseUrl.stripTrailing() + "/series=" + seriesParam + "&startDate=" + start + "&endDate=" + end + "&type=json";
        if (formulas != null && !formulas.isEmpty()) {
            url += "&formulas=" + formulas;
        }
        if (frequency != null) {
            url += "&frequency=" + frequency;
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
                    try { Thread.sleep(5000); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); break; } // Python'daki gibi 5 sn bekle
                }
            }
        }
        return new ArrayList<>();
    }

    /**
     * Uzun tarihçe için chunked fetch — EVDS'nin per-request 1000-nokta limitini aşmak için
     * verilen aralığı parça parça çağırır ve sonuçları birleştirir.
     * <p>
     * Her chunk {@code chunkYears} yıl uzunluğunda; günlük seriler için 3 yıl güvenli
     * (3y × 252 trade days ≈ 756 nokta < 1000 limit). API'yi yormamak için her chunk
     * arasında 200ms bekler.
     *
     * @param chunkYears Chunk uzunluğu (yıl). Günlük seri için 3, haftalık için 12 vb.
     */
    public List<JsonNode> fetchSeriesPaginated(List<String> seriesCodes, LocalDate startDate, LocalDate endDate, int chunkYears) {
        return fetchSeriesPaginated(seriesCodes, startDate, endDate, chunkYears, null);
    }

    /** {@link #fetchSeries(List, LocalDate, LocalDate, String, Integer)}'in paginated overload'ı. */
    public List<JsonNode> fetchSeriesPaginated(List<String> seriesCodes, LocalDate startDate, LocalDate endDate, int chunkYears, Integer frequency) {
        if (chunkYears < 1) chunkYears = 3;
        List<JsonNode> all = new ArrayList<>();
        java.util.Set<String> seenDates = new java.util.HashSet<>();

        LocalDate cursor = startDate;
        int chunks = 0;
        while (!cursor.isAfter(endDate)) {
            LocalDate chunkEnd = cursor.plusYears(chunkYears).minusDays(1);
            if (chunkEnd.isAfter(endDate)) chunkEnd = endDate;

            List<JsonNode> chunk = fetchSeries(seriesCodes, cursor, chunkEnd, null, frequency);
            int added = 0;
            for (JsonNode node : chunk) {
                String date = node.path("Tarih").asText(null);
                if (date == null) continue;
                if (seenDates.add(date)) { // dedup at chunk boundaries
                    all.add(node);
                    added++;
                }
            }
            log.info("[EVDS-PAGINATE] {} chunk {} ({} → {}): {} nokta",
                    String.join(",", seriesCodes), ++chunks, cursor, chunkEnd, added);

            cursor = chunkEnd.plusDays(1);
            try { Thread.sleep(200); } catch (InterruptedException e) { Thread.currentThread().interrupt(); break; } // hafif rate-limit dostu pause
        }
        log.info("[EVDS-PAGINATE] {} toplam: {} nokta ({} chunk)", String.join(",", seriesCodes), all.size(), chunks);
        return all;
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