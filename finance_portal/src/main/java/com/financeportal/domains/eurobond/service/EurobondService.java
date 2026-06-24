package com.financeportal.domains.eurobond.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.financeportal.domains.eurobond.client.BusinessInsiderBondClient;
import com.financeportal.domains.eurobond.client.BusinessInsiderBondClient.BusinessInsiderBondDetail;
import com.financeportal.domains.bond.config.BondMath;
import com.financeportal.domains.eurobond.config.EurobondCatalog;
import com.financeportal.domains.eurobond.dto.EurobondDto;
import com.financeportal.service.cache.CacheService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
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
    private static final long CACHE_TTL_MINUTES = 360;

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
        int consecutiveFailures = 0;
        for (EurobondCatalog.CatalogEntry entry : catalog.getEntries()) {
            BusinessInsiderBondDetail detail = client.fetchDetail(entry.getSlug());
            if (detail == null) {
                log.warn("[EUROBOND] Detay alınamadı, atlanıyor: {}", entry.getIsin());
                // FAIL-FAST: BusinessInsider bot-tarpit'i kaynağı erişilemez kılabiliyor (TCP açılır, yanıt
                // hiç gelmez → her istek read-timeout). İlk 2 istek üst üste düşer ve hâlâ veri yoksa kaynağı
                // "down" say, kalan ~N bono'yu N×timeout kadar bekletme → endpoint hızlı boş döner.
                if (++consecutiveFailures >= 2 && result.isEmpty()) {
                    log.warn("[EUROBOND] Kaynak erişilemez görünüyor ({} ardışık hata, veri yok) — fail-fast, kalan bonolar atlanıyor.",
                            consecutiveFailures);
                    break;
                }
                continue;
            }
            consecutiveFailures = 0;
            String currency = detail.getCurrency() != null ? detail.getCurrency() : entry.getCurrency();
            BigDecimal bondYield = resolveYield(detail);
            result.add(EurobondDto.builder()
                    .symbol(entry.getIsin())
                    .isin(entry.getIsin())
                    .name(buildName(detail.getCoupon(), detail.getMaturity(), currency))
                    .currency(currency)
                    .coupon(detail.getCoupon())
                    .maturity(detail.getMaturity())
                    .bondYield(bondYield)
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

    /**
     * Getiri (%): BI'nin hesaplanmış "yield of X%" cümlesi scrape'e gelirse onu kullan; gelmezse
     * (başlıksız isteğe locale-bağımlı bu cümle gelmiyor) elimizdeki temiz fiyat + kupon + vade'den
     * YTM hesapla (BondMath, indicative — yıllık bileşik varsayımı; BI'nin yarı-yıllık kotasyonundan
     * birkaç bp sapabilir). Hesaplanamazsa null (sütun "—" kalır).
     */
    private BigDecimal resolveYield(BusinessInsiderBondDetail detail) {
        if (detail.getBondYield() != null) return detail.getBondYield(); // BI'nin kotaladığı getiri (asıl kaynak)
        // Getiri scrape'e gelmediyse (partial parse) temiz fiyat + kupon + vade'den YTM hesapla (indicative fallback).
        if (detail.getPrice() == null || detail.getCoupon() == null || detail.getMaturity() == null) return null;
        try {
            double years = BondMath.yearsBetween(LocalDate.now(), LocalDate.parse(detail.getMaturity()));
            if (years <= 0) return null;
            double ytm = BondMath.yieldFromCleanPrice(detail.getPrice().doubleValue(),
                    detail.getCoupon().doubleValue(), years);
            return BigDecimal.valueOf(ytm).setScale(2, RoundingMode.HALF_UP);
        } catch (Exception e) {
            // YTM hesabı parse veya matematik hatasıyla sonuçlanırsa getiri sütunu "—" kalır; fiyat/kupon yine gösterilir.
            return null;
        }
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
