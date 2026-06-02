package com.financeportal.domains.turkish_bond.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.Collections;
import java.util.List;

/**
 * Türkiye Hazine tahvil/bono (DİBS) küratörlü kataloğu — vade kategorilerine göre seçilmiş
 * ISIN listesi. Geniş listeden (~1001) vade kovalarına (SHORT, Y1..Y5, Y10) ~28'er adet seçildi.
 *
 * Her giriş: symbol (TP.<ISIN>), isin, maturity (yyyy-MM-dd), bucket, name.
 * Liste {@code tr-bonds-catalog.json}'dan yüklenir. Yeni tahvil eklemek için JSON'a satır eklenir.
 */
@Component
@Slf4j
public class TurkishBondCatalog {

    private static final String RESOURCE = "tr-bonds-catalog.json";

    private final ObjectMapper objectMapper;
    private List<CatalogEntry> entries = Collections.emptyList();

    public TurkishBondCatalog(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    void load() {
        try (InputStream is = new ClassPathResource(RESOURCE).getInputStream()) {
            entries = objectMapper.readValue(is, objectMapper.getTypeFactory()
                    .constructCollectionType(List.class, CatalogEntry.class));
            log.info("[TR-BOND-CATALOG] {} tahvil yüklendi.", entries.size());
        } catch (Exception e) {
            log.error("[TR-BOND-CATALOG] Katalog yüklenemedi: {}", e.getMessage());
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
        private String symbol;   // TP.<ISIN>
        private String isin;
        private String maturity; // yyyy-MM-dd
        private String bucket;   // SHORT, Y1, Y2, Y3, Y4, Y5, Y10
        private String name;     // "DİBS dd.mm.yyyy"
    }
}
