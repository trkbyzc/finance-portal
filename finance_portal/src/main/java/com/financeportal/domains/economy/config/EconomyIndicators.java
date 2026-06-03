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

    private static final String CAT_INFLATION = "inflation";
    private static final String CAT_RATES = "rates";
    private static final String CAT_EXTERNAL = "external";
    private static final String UNIT_PCT = "%";

    /**
     * frequency: EVDS frequency parametresi (1=Günlük, 5=Aylık, 6=Çeyreklik, 8=Yıllık).
     * Çoğu seri için null (default frekansta çekilir); çeyreklik/yıllık seriler null'da boş döner.
     */
    public record Indicator(String key, String code, String formula, String category, String unit, Integer frequency) {
        public Indicator(String key, String code, String formula, String category, String unit) {
            this(key, code, formula, category, unit, null);
        }
    }

    public static final List<Indicator> ALL = List.of(
            // Enflasyon (yıllık % — formula 3)
            new Indicator("inflationRate", "TP.TUKFIY2025.GENEL", "3", CAT_INFLATION, UNIT_PCT),
            new Indicator("ppi", "TP.TUFE1YI.T1", "3", CAT_INFLATION, UNIT_PCT),
            new Indicator("coreInflation", "TP.FE25.OKTG04", "3", CAT_INFLATION, UNIT_PCT),
            // Faizler
            new Indicator("interestRate", "TP.APIFON4", null, CAT_RATES, UNIT_PCT),
            new Indicator("depositRate", "TP.TRY.MT02", null, CAT_RATES, UNIT_PCT),
            new Indicator("loanRate", "TP.KTF10", null, CAT_RATES, UNIT_PCT),
            // Büyüme & Gelir — TP.GSYIH26.HY.ZH ve TP.IMFGDPUSDPC.TUR kullandığımız EVDS endpoint'i
            // (igmevdsms-dis İnteraktif Grafik Modülü) tarafından sürekli boş döndü; başka serilerle
            // ya da resmi public endpoint ile düzeltme denendi ama yan etkili. Kapsam dışı bırakıldı.
            // Dış denge & rezerv
            new Indicator("currentAccount", "TP.ODANA6.Q01", null, CAT_EXTERNAL, "M$"),
            new Indicator("reserves", "TP.AB.B6", null, CAT_EXTERNAL, "M$"),
            new Indicator("reer", "TP.RK.T1.Y", null, CAT_EXTERNAL, ""),
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
