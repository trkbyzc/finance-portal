package com.financeportal.service.chat.tools;

import com.financeportal.model.enums.AssetType;
import com.financeportal.service.portfolio.PortfolioPriceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
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

        BigDecimal price;
        try {
            price = priceService.getCurrentPrice(symbol.trim().toUpperCase(), type);
        } catch (Exception e) {
            log.warn("[CHAT/tool] get_asset_price hata: {}", e.getMessage());
            return Map.of("error", "Fiyat çekilemedi: " + e.getMessage());
        }
        if (price == null) {
            return Map.of("error", "Fiyat bulunamadı: " + symbol);
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("symbol", symbol.toUpperCase());
        out.put("assetType", type.name());
        out.put("price", price);
        return out;
    }

    private String asString(Object o) {
        return o == null ? null : o.toString();
    }
}
