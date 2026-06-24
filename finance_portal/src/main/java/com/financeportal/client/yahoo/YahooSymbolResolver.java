package com.financeportal.client.yahoo;

import org.springframework.stereotype.Component;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

@Component
public class YahooSymbolResolver {

    private static final List<String> KNOWN_GLOBAL_ETFS = Arrays.asList(
            "SPY", "GLD", "TLT", "VNQ", "DIA", "IWM", "VTI", "VOO", "HYG", "LQD", "BND", "AGG", "IEF", "SHY"
    );

    private static final List<String> FIAT_CURRENCIES = Arrays.asList(
            "USD", "EUR", "GBP", "CHF", "CAD", "RUB", "AED", "AUD",
            "DKK", "SEK", "NOK", "JPY", "KWD", "ZAR", "BHD", "SAR"
    );

    public String resolve(String symbol) {
        if (symbol == null) return null;
        String upperSymbol = symbol.toUpperCase(Locale.ENGLISH);

        if (KNOWN_GLOBAL_ETFS.contains(upperSymbol)) return upperSymbol;

        // Sembol zaten Yahoo formatında (-USD, =X, .IS, =F) geldiyse dönüşüm yapma
        if (upperSymbol.contains("-USD") || upperSymbol.contains("=X") || upperSymbol.endsWith(".IS") || upperSymbol.endsWith("=F")) {
            return upperSymbol;
        }

        if (FIAT_CURRENCIES.contains(upperSymbol)) {
            return upperSymbol + "TRY=X";
        }

        String resolvedIndex = switch (upperSymbol) {
            case "XU100", "BIST100" -> "XU100.IS";
            case "XU030", "BIST30" -> "XU030.IS";
            case "XU050", "BIST50" -> "XU050.IS";
            case "XBANK", "BISTBANKA" -> "XBANK.IS";
            case "XUSIN", "BISTSINAI" -> "XUSIN.IS";
            default -> null;
        };

        if (resolvedIndex != null) return resolvedIndex;

        // 3-5 karakterli ve bilinen hiçbir kategoriye girmeyen semboller kripto olarak kabul edilir
        if (upperSymbol.length() >= 3 && upperSymbol.length() <= 5) {
            return upperSymbol + "-USD";
        }

        return upperSymbol;
    }
}