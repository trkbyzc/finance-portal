package com.financeportal.domains.bond.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.financeportal.domains.eurobond.config.EurobondCatalog;
import com.financeportal.domains.turkish_bond.config.TurkishBondCatalog;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/**
 * Sabit getirili enstrüman metadata sağlayıcısı (sembol → kotasyon tipi, kupon, vade, para birimi).
 *
 * <p>Kupon TİPİ değer-bazlı belirlenir ({@code dibs-coupons.json}, EVDS'den çekildi):
 * <ul>
 *   <li><b>FIXED</b> (kupon ≥ %6): gerçek nominal kupon → kuponlu tahvil fiyatlaması.</li>
 *   <li><b>ZERO</b> (kupon ≈ 0): iskontolu/sıfır-kupon bono → 100/(1+y)^t.</li>
 *   <li><b>REAL</b> (%0.5-6): TÜFE/düşük-reel kupon → "par-at-entry" (kupon = giriş getirisi).</li>
 * </ul>
 *
 * <p>DİBS getiri-kotalı (TRY); Eurobond fiyat-kotalı (USD, kupon/vade canlı DTO'dan dolar);
 * global ^TNX vb. getiri endeksidir (gerçek holding değil).
 */
@Component
@Slf4j
public class BondSpec {

    public enum Kind { DIBS, EUROBOND, INDEX }

    /** Tahvilin değerleme metadata'sı. Eurobond'da coupon/maturity caller tarafından canlı DTO ile set edilir. */
    public record BondInfo(Kind kind, String quoteType, BigDecimal coupon, String couponType,
                           LocalDate maturity, String currency, int freq) {
        public boolean isYieldQuoted() { return "YIELD".equalsIgnoreCase(quoteType); }
    }

    private static final String COUPON_RESOURCE = "dibs-coupons.json";
    private static final int DEFAULT_FREQ = 2; // TR DİBS / eurobond altı aylık kupon

    private final ObjectMapper objectMapper;
    private final TurkishBondCatalog dibsCatalog;
    private final EurobondCatalog eurobondCatalog;

    private Map<String, CouponEntry> coupons = Map.of();
    private final Map<String, LocalDate> maturityByIsin = new HashMap<>();
    private final Set<String> eurobondIsins = new HashSet<>();

    public BondSpec(ObjectMapper objectMapper, TurkishBondCatalog dibsCatalog, EurobondCatalog eurobondCatalog) {
        this.objectMapper = objectMapper;
        this.dibsCatalog = dibsCatalog;
        this.eurobondCatalog = eurobondCatalog;
    }

    private record CouponEntry(BigDecimal coupon, String type) {}

    @PostConstruct
    void load() {
        try (InputStream is = new ClassPathResource(COUPON_RESOURCE).getInputStream()) {
            coupons = objectMapper.readValue(is, objectMapper.getTypeFactory()
                    .constructMapType(HashMap.class, String.class, CouponEntry.class));
            log.info("[BOND-SPEC] {} DİBS kuponu yüklendi.", coupons.size());
        } catch (Exception e) {
            log.error("[BOND-SPEC] dibs-coupons.json yüklenemedi: {}", e.getMessage());
            coupons = Map.of();
        }
        for (TurkishBondCatalog.CatalogEntry e : dibsCatalog.getEntries()) {
            try {
                maturityByIsin.put(e.getIsin(), LocalDate.parse(e.getMaturity()));
            } catch (Exception ignored) { /* hatalı tarih satırı atlanır */ }
        }
        for (EurobondCatalog.CatalogEntry e : eurobondCatalog.getEntries()) {
            if (e.getIsin() != null) eurobondIsins.add(e.getIsin());
        }
        log.info("[BOND-SPEC] {} eurobond ISIN yüklendi.", eurobondIsins.size());
    }

    /** Sembol + kategoriden tahvil metadata'sı. DİBS için coupon/maturity dolu; eurobond canlı DTO'dan. */
    public BondInfo forSymbol(String symbol, String assetCategory) {
        String cat = assetCategory == null ? "" : assetCategory.toUpperCase();
        if (cat.equals("EUROBOND")) {
            // Eurobond fiyat-kotalı; kupon/vade caller tarafından canlı EurobondDto ile doldurulur.
            return new BondInfo(Kind.EUROBOND, "PRICE", null, "FIXED", null, "USD", DEFAULT_FREQ);
        }

        String isin = (symbol != null && symbol.startsWith("TP.")) ? symbol.substring(3) : symbol;
        if (isin != null && maturityByIsin.containsKey(isin)) {
            CouponEntry ce = coupons.get(isin);
            BigDecimal coupon = ce != null ? ce.coupon() : null;
            String type = ce != null ? ce.type() : "REAL"; // kupon bilinmiyorsa güvenli: par-at-entry
            return new BondInfo(Kind.DIBS, "YIELD", coupon, type, maturityByIsin.get(isin), "TRY", DEFAULT_FREQ);
        }

        // Eurobond ISIN (katalog) — fiyat-kotalı; category gelmese de tanı (valuateBond null geçiyor,
        // aksi halde EUROBOND yerine INDEX'e düşüp getiri sanılır → K/Z hep 0 çıkardı).
        if (symbol != null && eurobondIsins.contains(symbol)) {
            return new BondInfo(Kind.EUROBOND, "PRICE", null, "FIXED", null, "USD", DEFAULT_FREQ);
        }

        // Global ^TNX/^TY vb. — getiri endeksi, gerçek tahvil pozisyonu değil.
        return new BondInfo(Kind.INDEX, "YIELD", null, "ZERO", null, "USD", DEFAULT_FREQ);
    }

    /** Eurobond canlı DTO verisini (kupon, vade) BondInfo'ya bağlar. */
    public BondInfo withEurobondData(BigDecimal coupon, LocalDate maturity, String currency) {
        return new BondInfo(Kind.EUROBOND, "PRICE", coupon, "FIXED", maturity,
                currency == null || currency.isBlank() ? "USD" : currency, DEFAULT_FREQ);
    }
}
