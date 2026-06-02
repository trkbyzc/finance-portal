package com.financeportal.domains.eurobond.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.io.InputStream;
import java.util.Collections;
import java.util.List;

/**
 * Türkiye Hazine eurobondlarının küratörlü kataloğu — tek doğruluk kaynağı.
 *
 * Kimlik bilgileri (ISIN, businessinsider slug, döviz) sabittir; fiyat/getiri/kupon/vade/grafik
 * businessinsider'dan CANLI çekilir ({@link com.financeportal.domains.eurobond.client.BusinessInsiderBondClient}).
 * Yeni ihraç çıkınca eurobonds-catalog.json'a tek satır eklemek yeterli.
 *
 * Slug'lar businessinsider ihraççı (borrower=4519, "Türkei, Republik") sayfasından alınmıştır.
 */
@Component
@Slf4j
public class EurobondCatalog {

    private static final String CATALOG_RESOURCE = "eurobonds-catalog.json";

    private final ObjectMapper objectMapper;
    private List<CatalogEntry> entries = Collections.emptyList();

    public EurobondCatalog(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    void load() {
        try (InputStream is = new ClassPathResource(CATALOG_RESOURCE).getInputStream()) {
            entries = objectMapper.readValue(is, objectMapper.getTypeFactory()
                    .constructCollectionType(List.class, CatalogEntry.class));
            log.info("[EUROBOND-CATALOG] {} eurobond yüklendi.", entries.size());
        } catch (Exception e) {
            log.error("[EUROBOND-CATALOG] Katalog yüklenemedi: {}", e.getMessage());
            entries = Collections.emptyList();
        }
    }

    public List<CatalogEntry> getEntries() {
        return entries;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CatalogEntry {
        private String isin;
        private String slug;
        private String currency;
    }
}
