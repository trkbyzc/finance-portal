package com.financeportal.service.chat.tools;

import com.financeportal.model.enums.AssetType;
import com.financeportal.service.portfolio.PortfolioPriceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Bir varlığın anlık fiyatını döner.
 * Kullanıcı "BTC ne kadar", "Apple hissesi kaç dolar" gibi sorularda bunu çağırır.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class GetAssetPriceTool implements ChatTool {

    private final PortfolioPriceService priceService;

    @Override
    public String name() { return "get_asset_price"; }

    @Override
    public String description() {
        return "Bir varlığın anlık fiyatını döner. Argümanlar: symbol (string, gerekli), "
                + "assetType (string, gerekli; STOCK/CRYPTO/CURRENCY/COMMODITY/BOND/FUND/FUTURE).";
    }

    @Override
    public Map<String, Object> parametersJsonSchema() {
        return Map.of(
                "type", "object",
                "properties", Map.of(
                        "symbol", Map.of(
                                "type", "string",
                                "description", "Varlık sembolü, örn. BTC, AAPL, THYAO, USD"
                        ),
                        "assetType", Map.of(
                                "type", "string",
                                "enum", List.of("STOCK", "CRYPTO", "CURRENCY", "COMMODITY", "BOND", "FUND", "FUTURE"),
                                "description", "Varlık türü"
                        )
                ),
                "required", List.of("symbol", "assetType")
        );
    }

    @Override
    public Object execute(Map<String, Object> args) {
        String symbol = asString(args.get("symbol"));
        String typeStr = asString(args.get("assetType"));
        if (symbol == null || symbol.isBlank()) {
            return Map.of("error", "symbol boş olamaz");
        }
        if (typeStr == null || typeStr.isBlank()) {
            return Map.of("error", "assetType boş olamaz");
        }
        AssetType type;
        try {
            type = AssetType.valueOf(typeStr.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return Map.of("error", "Geçersiz assetType: " + typeStr);
        }

        String original = symbol.trim().toUpperCase();

        // LLM tipik bare sembol gönderir ("THYAO", "BTC", "USD"); domain servisleri ise
        // kendi formatlarında saklar (BIST: THYAO.IS, Yahoo crypto: BTC-USD, vs.).
        // candidates() asset type'ına göre olası variant'ları sırayla dener — ilk pozitif
        // sonuç kazanır.
        String resolved = original;
        BigDecimal price = null;
        for (String candidate : candidates(original, type)) {
            BigDecimal p = tryFetch(candidate, type);
            if (p != null && p.signum() > 0) {
                price = p;
                resolved = candidate;
                break;
            }
        }

        if (price == null || price.signum() == 0) {
            return Map.of("error", "Fiyat bulunamadı: " + original);
        }

        String currency = currencyFor(resolved, type);

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("symbol", original);
        if (!resolved.equals(original)) out.put("resolvedSymbol", resolved);
        out.put("assetType", type.name());
        out.put("price", price);
        out.put("currency", currency);
        return out;
    }

    /**
     * Asset type'ına göre olası sembol variant'ları (sırayla denenir).
     * Domain servisleri kendi formatlarında saklar; LLM ise tipik bare sembol gönderir.
     *
     *   STOCK     : THYAO     → [THYAO, THYAO.IS]                (BIST .IS suffix'i)
     *   CRYPTO    : BTC       → [BTC, BTC-USD]                   (Yahoo crypto fallback)
     *   CURRENCY  : USD       → [USD, USDTRY=X, USD=X]           (TCMB bare; Yahoo TRY=X)
     *   COMMODITY : ALTIN     → [ALTIN, ALTINUSD, ALTIN=F]       (TR altın bare; Yahoo futures)
     *   BOND      : TR123     → [TR123]                          (servis kendi tarar)
     *   FUND      : AFA       → [AFA]                            (TR fon kodu bare)
     *   FUTURE    : F_XU100   → [F_XU100, F_XU100.IS]            (VİOP)
     */
    private List<String> candidates(String bare, AssetType type) {
        String b = bare.toUpperCase();
        List<String> list = new ArrayList<>();
        list.add(b); // her durumda önce bare dene
        switch (type) {
            case STOCK -> {
                if (!b.endsWith(".IS")) list.add(b + ".IS");
            }
            case CRYPTO -> {
                if (!b.endsWith("-USD")) list.add(b + "-USD");
            }
            case CURRENCY -> {
                if (!b.contains("=X")) {
                    list.add(b + "TRY=X");
                    list.add(b + "=X");
                }
            }
            case COMMODITY -> {
                if (!b.endsWith("=F") && !b.endsWith("USD")) {
                    list.add(b + "USD");
                    list.add(b + "=F");
                }
            }
            case FUTURE -> {
                if (!b.endsWith(".IS")) list.add(b + ".IS");
            }
            case BOND, FUND -> { /* bare yeterli — servis kendi yapısında tarar */ }
        }
        return list;
    }

    private BigDecimal tryFetch(String sym, AssetType type) {
        try {
            return priceService.getCurrentPrice(sym, type);
        } catch (Exception e) {
            log.warn("[CHAT/tool] get_asset_price fetch hata: sym={}, type={}, err={}",
                    sym, type, e.getMessage());
            return null;
        }
    }

    /**
     * Fiyatın hangi para biriminde olduğunu, resolved sembolün şekline bakarak çıkar.
     * Resolved variant ipucu verir: .IS → BIST = TRY; USD/=F suffix'i → USD; =X TRY'ye çevrilmiş.
     */
    private String currencyFor(String sym, AssetType type) {
        return switch (type) {
            case STOCK    -> sym.endsWith(".IS") ? "TRY" : "USD";
            case CRYPTO   -> "USD";                                       // CoinGecko current_price USD
            case CURRENCY -> "TRY";                                       // TCMB forex selling (X→TRY)
            case COMMODITY -> (sym.endsWith("USD") || sym.endsWith("=F")) ? "USD" : "TRY";
            case BOND     -> (sym.startsWith("TR") || sym.endsWith(".IS")) ? "TRY" : "USD";
            case FUND     -> "TRY";                                       // TR fonlar TRY; global fonlar nadir
            case FUTURE   -> "TRY";                                       // VİOP TRY
        };
    }

    private String asString(Object o) {
        return o == null ? null : o.toString();
    }
}
