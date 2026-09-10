package com.financeportal.config.datasource;

/**
 * Veri sağlayıcı anahtarları. Yapılandırma dosyasındaki
 * {@code data-sources.policies.<anahtar>} bölümleriyle birebir eşleşir.
 *
 * <p>Anahtar başına <b>sağlayıcı</b> tutulur, uç nokta başına değil: aynı sağlayıcıdan
 * beslenen bütün ekranlar tek bayrakla açılıp kapanır. Böylece "BİST hisseleri açık ama
 * BİST endeksi kapalı" gibi tutarsız durumlar oluşmaz.
 */
public final class DataSourceKeys {

    private DataSourceKeys() {
    }

    // --- Resmî API'ler (canlıda açık kalması beklenir) ---

    /** TCMB EVDS — döviz, efektif kur, Türkiye makro göstergeleri. Resmî API + anahtar. */
    public static final String EVDS = "evds";

    /** FRED (St. Louis Fed) — ABD makro göstergeleri. Resmî API + anahtar. */
    public static final String FRED = "fred";

    /** Binance — kripto fiyat ve OHLC. Resmî açık API. */
    public static final String BINANCE = "binance";

    /** CoinGecko — kripto piyasa verisi. Resmî ücretsiz katman. */
    public static final String COINGECKO = "coingecko";

    /** Finnhub — piyasa verisi ve haber. Resmî API + anahtar. */
    public static final String FINNHUB = "finnhub";

    /** Truncgil — Türk altını / döviz. Ücretsiz yayınlanan API. */
    public static final String TRUNCGIL = "truncgil";

    /** alternative.me — Kripto Korku & Açgözlülük endeksi. Ücretsiz açık API. */
    public static final String FEAR_GREED = "feargreed";

    /** RSS haber akışları — syndication için yayınlanır, başlık + özet + kaynak linki. */

    // --- Resmî olmayan uçlar ---

    /** Yahoo Finance — küresel hisse, endeks, emtia, ETF, tahvil, vadeli. Belgelenmemiş uç. */
    public static final String YAHOO = "yahoo";

    /** TradingView sembol logoları — üçüncü tarafın marka varlıkları. */
    public static final String TRADINGVIEW_LOGO = "tradingview-logo";

    /** Business Insider — küresel tahvil kotasyonları. */
    public static final String BUSINESS_INSIDER = "businessinsider";

    /** Hesapkurdu — mevduat/kredi oranları. Dahili API gateway. */
    public static final String HESAPKURDU = "hesapkurdu";

    // --- Kazıma (scraping) ---

    /** Fintables — BİST hisseleri ve TEFAS fonları. <b>Ücretli abonelik ürünü.</b> */
    public static final String FINTABLES = "fintables";

    /** İş Yatırım — temel veriler, BİST endeksi, VİOP kontratları. */
    public static final String ISYATIRIM = "isyatirim";

    /** halkarz.com — halka arz (IPO) takvimi. */
    public static final String IPO_SCRAPER = "ipo-scraper";

    /** Haber tam metni — keyfi bir URL'in içeriğini çekip uygulamada gösterme. */

    /**
     * tr.investing.com ekonomik takvimi. Sahte User-Agent ile kazınıyor;
     * sitenin şartları bunu açıkça yasaklar.
     */
    public static final String INVESTING_CALENDAR = "investing-calendar";
}
