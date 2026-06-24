package com.financeportal.domains.news.service;

import org.springframework.stereotype.Component;
import java.util.List;
import java.util.Locale;

/**
 * Haber metnini anahtar kelime eşleştirmesiyle 7 kategoriden birine atar.
 * Sıra önemli: kripto/fon gibi spesifik kategoriler önce, "Genel Ekonomi" en son fallback.
 */
@Component
public class NewsCategoryClassifier {

    public static final String KRIPTO = "Kripto";
    public static final String BORSA = "Borsa";
    public static final String DOVIZ = "Döviz & Forex";
    public static final String EMTIALAR = "Emtialar";
    public static final String TAHVIL = "Tahvil & Faiz";
    public static final String FONLAR = "Yatırım Fonları";
    public static final String GENEL = "Genel Ekonomi";

    // EN karşılıkları — frontend'in i18n key'lerine ihtiyaç duymadan doğrudan yazılabilir.
    private static final java.util.Map<String, String> TR_TO_EN = java.util.Map.of(
            KRIPTO, "Crypto",
            BORSA, "Stocks",
            DOVIZ, "Forex",
            EMTIALAR, "Commodities",
            TAHVIL, "Bonds & Rates",
            FONLAR, "Funds",
            GENEL, "Economy"
    );

    public static String localize(String trCategory, String lang) {
        if (trCategory == null) return null;
        if ("en".equalsIgnoreCase(lang)) {
            return TR_TO_EN.getOrDefault(trCategory, trCategory);
        }
        return trCategory;
    }

    private static final List<String> KRIPTO_KEYWORDS = List.of(
            "bitcoin", "kripto", "ethereum", "blockchain", "btc", "eth",
            "stablecoin", "defi", "nft", "binance", "altcoin", "memecoin",
            "solana", "ripple", "xrp", "doge"
    );

    private static final List<String> BORSA_KEYWORDS = List.of(
            "borsa", "hisse", "bist", "nasdaq", "dow jones", "s&p", "sermaye piyasa",
            "ipo", "halka arz", "hisse senedi", "endeks", "viop", "sp500", "wall street",
            "temettü", "kâr payı", "kar payı", "spk", "şirket bilanço"
    );

    private static final List<String> DOVIZ_KEYWORDS = List.of(
            "dolar", "euro", "sterlin", "yen", "kur", "forex", "fed", "ecb", "tcmb",
            "merkez bankası", "faiz", "parite", "swap", "döviz", "lira"
    );

    private static final List<String> EMTIA_KEYWORDS = List.of(
            "altın", "gümüş", "petrol", "brent", "emtia", "bakır", "doğalgaz",
            "kıymetli maden", "ons", "platin", "paladyum", "buğday", "mısır", "kahve",
            "pamuk", "şeker", "metal", "ham petrol"
    );

    private static final List<String> TAHVIL_KEYWORDS = List.of(
            "tahvil", "dibs", "bono", "eurobond", "kupon", "hazine", "getiri", "yield",
            "faiz oranı", "10 yıllık", "2 yıllık", "5 yıllık", "borçlanma senedi",
            "iç borç", "dış borç", "gösterge faiz", "treasury", "devlet tahvili"
    );

    private static final List<String> FON_KEYWORDS = List.of(
            "fon", "tefas", "portföy", "etf", "yatırım fonu", "hisse fonu",
            "para piyasası fonu", "serbest fon", "emeklilik fonu",
            "katılım fonu", "endeks fonu"
    );

    private static final List<String> GENEL_KEYWORDS = List.of(
            "enflasyon", "büyüme", "tüfe", "üfe", "işsizlik", "gsyh", "imf", "dünya bankası",
            "bütçe", "vergi", "ekonomi paketi", "kredi", "sanayi üretim", "cari açık",
            "ihracat", "ithalat", "ticaret"
    );

    public String assignCategory(String title, String desc) {
        if (title == null) title = "";
        if (desc == null) desc = "";

        String text = (title + " " + desc).toLowerCase(Locale.of("tr", "TR"));

        if (matchesAny(text, KRIPTO_KEYWORDS)) return KRIPTO;
        if (matchesAny(text, FON_KEYWORDS)) return FONLAR;
        if (matchesAny(text, TAHVIL_KEYWORDS)) return TAHVIL;
        if (matchesAny(text, EMTIA_KEYWORDS)) return EMTIALAR;
        if (matchesAny(text, DOVIZ_KEYWORDS)) return DOVIZ;
        if (matchesAny(text, BORSA_KEYWORDS)) return BORSA;
        if (matchesAny(text, GENEL_KEYWORDS)) return GENEL;

        return GENEL;
    }

    private boolean matchesAny(String text, List<String> keywords) {
        for (String kw : keywords) {
            if (text.contains(kw)) return true;
        }
        return false;
    }
}
