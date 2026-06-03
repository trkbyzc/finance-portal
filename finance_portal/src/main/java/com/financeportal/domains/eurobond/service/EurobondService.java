package com.financeportal.domains.eurobond.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.financeportal.domains.eurobond.client.BusinessInsiderBondClient;
import com.financeportal.domains.eurobond.client.BusinessInsiderBondClient.BusinessInsiderBondDetail;
import com.financeportal.domains.eurobond.config.EurobondCatalog;
import com.financeportal.domains.eurobond.dto.EurobondDto;
import com.financeportal.service.cache.CacheService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Türkiye Hazine eurobond listesini sağlar.
 *
 * Kimlikler {@link EurobondCatalog}'tan (küratörlü), fiyat/getiri/kupon/vade/değişim/döviz
 * businessinsider'dan CANLI çekilir ({@link BusinessInsiderBondClient}). Sonuç 6 saat cache'lenir.
 * {@link #resolveTkData(String)} grafik stratejisinin isin→tkData çözümü için kullanılır.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EurobondService {

    private static final String CACHE_KEY = "cache:eurobonds";
    private static final long CACHE_TTL_MINUTES = 360; // 6 saat

    private final EurobondCatalog catalog;
    private final BusinessInsiderBondClient client;
    private final CacheService cacheService;
    private final ObjectMapper objectMapper;

    /**
     * Eurobond listesini cache'ten döner. CacheService (GenericJackson2) cache-hit'te
     * elemanları LinkedHashMap olarak döndürür; tip güvenliği için ObjectMapper ile
     * EurobondDto'ya çeviriyoruz (cache-miss'te zaten DTO).
     */
    public List<EurobondDto> getEurobondList() {
        List<?> raw = cacheService.getOrFetch(CACHE_KEY, this::buildList, CACHE_TTL_MINUTES);
        return raw.stream()
                .map(o -> objectMapper.convertValue(o, EurobondDto.class))
                .toList();
    }

    /** ISIN (sembol) → businessinsider tkData; bulunamazsa null. */
    public String resolveTkData(String symbol) {
        if (symbol == null) return null;
        String target = symbol.trim().toUpperCase(Locale.ENGLISH);
        return getEurobondList().stream()
                .filter(b -> target.equalsIgnoreCase(b.getIsin()))
                .map(EurobondDto::getTkData)
                .findFirst()
                .orElse(null);
    }

    private List<EurobondDto> buildList() {
        List<EurobondDto> result = new ArrayList<>();
        for (EurobondCatalog.CatalogEntry entry : catalog.getEntries()) {
            BusinessInsiderBondDetail detail = client.fetchDetail(entry.getSlug());
            if (detail == null) {
                log.warn("[EUROBOND] Detay alınamadı, atlanıyor: {}", entry.getIsin());
                continue;
            }
            String currency = detail.getCurrency() != null ? detail.getCurrency() : entry.getCurrency();
            result.add(EurobondDto.builder()
                    .symbol(entry.getIsin())
                    .isin(entry.getIsin())
                    .name(buildName(detail.getCoupon(), detail.getMaturity(), currency))
                    .currency(currency)
                    .coupon(detail.getCoupon())
                    .maturity(detail.getMaturity())
                    .bondYield(detail.getBondYield())
                    .price(detail.getPrice())
                    .changePercent(detail.getChangePercent())
                    .tkData(detail.getTkData())
                    .chartType("LINE")
                    .assetCategory("EUROBOND")
                    .build());
        }
        log.info("[EUROBOND] {} eurobond derlendi (katalog: {}).", result.size(), catalog.getEntries().size());
        return result;
    }

    /** "Türkiye %6.375 2031 (USD)" — kupon/vade yoksa makul fallback. */
    private String buildName(BigDecimal coupon, String maturity, String currency) {
        String year = (maturity != null && maturity.length() >= 4) ? maturity.substring(0, 4) : "";
        StringBuilder sb = new StringBuilder("Türkiye");
        if (coupon != null) sb.append(" %").append(coupon.stripTrailingZeros().toPlainString());
        if (!year.isEmpty()) sb.append(' ').append(year);
        if (currency != null) sb.append(" (").append(currency).append(')');
        return sb.toString();
    }
}
