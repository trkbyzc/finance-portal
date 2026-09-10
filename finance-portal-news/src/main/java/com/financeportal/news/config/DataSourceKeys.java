package com.financeportal.news.config;

/**
 * Bu serviste kullanilan veri kaynagi anahtarlari.
 *
 * <p>Backend'in DataSourceKeys sinifinda 20'den fazla anahtar var (yahoo, fintables,
 * isyatirim, hesapkurdu...). Buraya YALNIZCA haber servisinin gercekten sordugu
 * anahtarlar alindi — kullanilmayan sabitleri tasimak, servisin sinirini bulanik
 * gosterirdi.
 *
 * <p>Degerler {@code application.yaml} icindeki {@code data-sources.policies.*}
 * anahtarlariyla birebir eslesmek ZORUNDA.
 */
public final class DataSourceKeys {

    private DataSourceKeys() {}

    /**
     * Haber basliklarinin geldigi RSS akislari. Canlida ACIK: RSS zaten yeniden
     * dagitim icin yayimlanir ve baslik kaynagina yonlendirir.
     */
    public static final String NEWS_RSS = "news-rss";

    /**
     * Makalenin TAM METNI. Canlida KAPALI: telifli icerigi uygulama icinde
     * gostermek yeniden yayin olurdu.
     */
    public static final String NEWS_CONTENT = "news-content";
}
