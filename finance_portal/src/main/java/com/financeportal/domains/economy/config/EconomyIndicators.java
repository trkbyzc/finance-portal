package com.financeportal.domains.economy.config;

import java.util.List;

/**
 * Ekonomi göstergeleri kayıt defteri — EVDS seri kodları (kategoriye göre).
 *
 * Her gösterge: metric key (frontend + Redis), EVDS kodu, formula (3=yıllık %değişim, null=seviye),
 * kategori (frontend gruplama), birim. Sync bu listeyi gezip {@code evds:history:macro:<key>}'e yazar;
 * frontend {@code /economy/historical?metric=<key>} ile okur.
 *
 * Seri kodları TCMB EVDS'ten (kullanıcı tarafından doğrulanmış).
 */
public final class EconomyIndicators {

    private EconomyIndicators() {}

    public record Indicator(String key, String code, String formula, String category, String unit) {}

    public static final List<Indicator> ALL = List.of(
            // Enflasyon (yıllık % — formula 3)
            new Indicator("inflationRate", "TP.TUKFIY2025.GENEL", "3", "inflation", "%"),
            new Indicator("ppi", "TP.TUFE1YI.T1", "3", "inflation", "%"),
            new Indicator("coreInflation", "TP.FE25.OKTG04", "3", "inflation", "%"),
            // Faizler
            new Indicator("interestRate", "TP.APIFON4", null, "rates", "%"),
            new Indicator("depositRate", "TP.TRY.MT02", null, "rates", "%"),
            new Indicator("loanRate", "TP.KTF10", null, "rates", "%"),
            // Büyüme & Gelir
            new Indicator("gdp", "TP.GSYIH26.HY.ZH", null, "growth", ""),
            new Indicator("gdpPerCapita", "TP.IMFGDPUSDPC.TUR", null, "growth", "$"),
            // Dış denge & rezerv
            new Indicator("currentAccount", "TP.ODANA6.Q01", null, "external", "M$"),
            new Indicator("reserves", "TP.AB.B6", null, "external", "M$"),
            new Indicator("reer", "TP.RK.T1.Y", null, "external", ""),
            // Döviz kurları
            new Indicator("usdTry", "TP.DK.USD.A.YTL", null, "fx", "₺"),
            new Indicator("eurTry", "TP.DK.EUR.A.YTL", null, "fx", "₺"),
            // İşgücü
            new Indicator("unemploymentRate", "TP.YISGUCU2.G8", null, "labor", "%"),
            // Bütçe
            new Indicator("budgetBalance", "TP.KB.GEN35", null, "budget", "M₺"),
            // Aktivite & güven
            new Indicator("capacityUtilization", "TP.KKO.MA", null, "activity", "%"),
            new Indicator("consumerConfidence", "TP.TG2.Y01", null, "activity", ""),
            // Borsa & altın
            new Indicator("bist100", "TP.MK.F.BILESIK", null, "market", ""),
            new Indicator("gramGold", "TP.MK.KUL.YTL", null, "market", "₺")
    );
}
