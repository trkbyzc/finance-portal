package com.financeportal.demo;

import com.financeportal.domains.fund.dto.FundDto;
import com.financeportal.domains.stock.dto.StockDto;
import com.financeportal.domains.viop.dto.ViopDto;
import com.financeportal.model.dto.market.HistoricalDataDto;
import com.financeportal.model.dto.market.MarketAssetDto;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

/**
 * Canlı demo için sentetik piyasa verisi üretir.
 *
 * <h3>Neden var?</h3>
 * Canlı demonun amacı gerçek fiyat sunmak değil, uygulamanın nasıl çalıştığını
 * göstermektir. Bazı sağlayıcıların kullanım şartları verilerinin üçüncü taraflarca
 * yeniden sunulmasına izin vermiyor. Bu yüzden canlı ortamda o sağlayıcılara
 * <b>hiç istek atılmaz</b>; yerine burada üretilen veri kullanılır.
 *
 * <h3>Nasıl üretiliyor?</h3>
 * Değerler rastgele değil <b>deterministik</b>: tohum {@code sembol + gün}. Böylece
 * fiyatlar gün içinde sabit kalır (her sayfa yenilemesinde zıplamaz), ertesi gün
 * değişir. Bu, gerçek bir piyasa hissi verir ama tamamen üretilmiş veridir.
 *
 * <p>Gerçek sağlayıcılar yalnızca yerel kurulumda etkindir.
 */
@Component
public class DemoMarketData {

    /** BİST'te işlem gören şirketler — sembol → (ad, yaklaşık fiyat çıpası). */
    private static final Map<String, Object[]> BIST = new LinkedHashMap<>();
    /** TEFAS fonları — kod → (ad, çıpa). */
    private static final Map<String, Object[]> FUNDS = new LinkedHashMap<>();
    /** Bilinen küresel semboller için okunabilir ad ve çıpa. */
    private static final Map<String, Object[]> GLOBAL = new LinkedHashMap<>();

    static {
        BIST.put("THYAO", new Object[]{"Türk Hava Yolları", 296.75});
        BIST.put("GARAN", new Object[]{"Garanti BBVA", 133.50});
        BIST.put("ASELS", new Object[]{"Aselsan", 392.50});
        BIST.put("AKBNK", new Object[]{"Akbank", 71.20});
        BIST.put("BIMAS", new Object[]{"BİM Mağazalar", 598.00});
        BIST.put("EREGL", new Object[]{"Ereğli Demir Çelik", 39.84});
        BIST.put("KCHOL", new Object[]{"Koç Holding", 228.40});
        BIST.put("SAHOL", new Object[]{"Sabancı Holding", 104.30});
        BIST.put("SISE", new Object[]{"Şişecam", 42.16});
        BIST.put("TUPRS", new Object[]{"Tüpraş", 172.90});
        BIST.put("YKBNK", new Object[]{"Yapı Kredi", 37.88});
        BIST.put("ISCTR", new Object[]{"İş Bankası (C)", 14.62});
        BIST.put("VAKBN", new Object[]{"VakıfBank", 34.90});
        BIST.put("HALKB", new Object[]{"Halkbank", 48.55});
        BIST.put("PGSUS", new Object[]{"Pegasus", 155.80});
        BIST.put("TCELL", new Object[]{"Turkcell", 102.75});
        BIST.put("TOASO", new Object[]{"Tofaş", 299.50});
        BIST.put("FROTO", new Object[]{"Ford Otosan", 1024.00});
        BIST.put("ARCLK", new Object[]{"Arçelik", 96.05});
        BIST.put("PETKM", new Object[]{"Petkim", 23.06});
        BIST.put("HEKTS", new Object[]{"Hektaş", 2.91});
        BIST.put("TAVHL", new Object[]{"TAV Havalimanları", 279.25});
        BIST.put("ULKER", new Object[]{"Ülker Bisküvi", 96.90});
        BIST.put("MGROS", new Object[]{"Migros", 512.50});
        BIST.put("SOKM", new Object[]{"Şok Marketler", 60.35});
        BIST.put("EKGYO", new Object[]{"Emlak Konut GYO", 20.78});
        BIST.put("KRDMD", new Object[]{"Kardemir (D)", 47.10});
        BIST.put("TSKB", new Object[]{"TSKB", 11.58});
        BIST.put("VESTL", new Object[]{"Vestel", 58.44});
        BIST.put("AEFES", new Object[]{"Anadolu Efes", 19.46});

        FUNDS.put("AAK", new Object[]{"Ata Portföy Çoklu Varlık Fonu", 35.21});
        FUNDS.put("TP2", new Object[]{"Türkiye Portföy Hisse Fonu", 12.84});
        FUNDS.put("IPJ", new Object[]{"İş Portföy Teknoloji Fonu", 8.47});
        FUNDS.put("GAF", new Object[]{"Garanti Portföy Altın Fonu", 4.92});
        FUNDS.put("YAS", new Object[]{"Yapı Kredi Portföy Serbest Fon", 21.36});
        FUNDS.put("AFA", new Object[]{"Ak Portföy Alternatif Enerji", 6.18});
        FUNDS.put("DBH", new Object[]{"Deniz Portföy BIST Banka", 17.55});
        FUNDS.put("TCD", new Object[]{"TEB Portföy Değişken Fon", 9.73});

        GLOBAL.put("AAPL", new Object[]{"Apple Inc.", 232.40});
        GLOBAL.put("MSFT", new Object[]{"Microsoft Corp.", 428.60});
        GLOBAL.put("GOOGL", new Object[]{"Alphabet Inc.", 168.20});
        GLOBAL.put("AMZN", new Object[]{"Amazon.com Inc.", 186.90});
        GLOBAL.put("NVDA", new Object[]{"NVIDIA Corp.", 121.35});
        GLOBAL.put("TSLA", new Object[]{"Tesla Inc.", 244.80});
        GLOBAL.put("META", new Object[]{"Meta Platforms", 512.70});
        GLOBAL.put("^GSPC", new Object[]{"S&P 500", 5648.40});
        GLOBAL.put("^IXIC", new Object[]{"Nasdaq Composite", 17713.60});
        GLOBAL.put("^DJI", new Object[]{"Dow Jones", 41240.50});
        GLOBAL.put("GC=F", new Object[]{"Altın (ONS)", 2531.80});
        GLOBAL.put("SI=F", new Object[]{"Gümüş (ONS)", 28.94});
        GLOBAL.put("CL=F", new Object[]{"Ham Petrol (WTI)", 69.35});
        GLOBAL.put("BZ=F", new Object[]{"Brent Petrol", 72.80});
        GLOBAL.put("NG=F", new Object[]{"Doğalgaz", 2.18});
        GLOBAL.put("SPY", new Object[]{"SPDR S&P 500 ETF", 562.10});
        GLOBAL.put("QQQ", new Object[]{"Invesco QQQ Trust", 476.30});
        GLOBAL.put("VTI", new Object[]{"Vanguard Total Market", 275.60});
    }

    // ------------------------------------------------------------------
    // Deterministik çekirdek
    // ------------------------------------------------------------------

    /** Tohum: sembol + gün. Aynı gün içinde aynı sonucu üretir. */
    private Random rng(String symbol, String salt) {
        long day = LocalDate.now(ZoneOffset.UTC).toEpochDay();
        return new Random((symbol + '|' + salt).hashCode() * 31L + day);
    }

    /** Bilinen sembolde çıpa fiyat, bilinmeyende sembolden türetilen makul bir değer. */
    private double anchor(String symbol, Map<String, Object[]> table) {
        Object[] row = table.get(stripSuffix(symbol));
        if (row != null) return (double) row[1];
        int h = Math.abs(symbol.hashCode() % 1000);
        return 10 + h / 4.0;
    }

    private String nameOf(String symbol, Map<String, Object[]> table) {
        Object[] row = table.get(stripSuffix(symbol));
        return row != null ? (String) row[0] : stripSuffix(symbol);
    }

    private static String stripSuffix(String symbol) {
        if (symbol == null) return "";
        return symbol.replace(".IS", "").replace("-USD", "").trim().toUpperCase();
    }

    private static BigDecimal money(double v) {
        return BigDecimal.valueOf(v).setScale(4, RoundingMode.HALF_UP);
    }

    /** Günlük değişim: −%4 ile +%4 arasında, sembole göre deterministik. */
    private double dailyChange(String symbol) {
        return (rng(symbol, "chg").nextDouble() * 8.0) - 4.0;
    }

    private double priceOf(String symbol, Map<String, Object[]> table) {
        double base = anchor(symbol, table);
        return base * (1 + dailyChange(symbol) / 100.0);
    }

    private long volumeOf(String symbol) {
        return 50_000L + (long) (rng(symbol, "vol").nextDouble() * 9_950_000L);
    }

    // ------------------------------------------------------------------
    // Alan başına üreticiler
    // ------------------------------------------------------------------

    /** BİST hisseleri — Fintables kapalıyken kullanılır. */
    public List<StockDto> turkishStocks() {
        List<StockDto> list = new ArrayList<>();
        int i = 0;
        for (String code : BIST.keySet()) {
            String symbol = code + ".IS";
            double price = priceOf(symbol, BIST);
            StockDto dto = new StockDto();
            dto.setSymbol(symbol);
            dto.setName(nameOf(symbol, BIST));
            dto.setAssetType("HİSSE SENEDİ");
            dto.setPrice(money(price));
            dto.setBuyPrice(money(price * 0.999));
            dto.setChangePercent(money(dailyChange(symbol)));
            dto.setVolume(volumeOf(symbol));
            dto.setYahooSymbol(symbol);
            dto.setChartType("STOCK");
            dto.setAssetCategory("STOCK");
            dto.setInBist30(i < 10);
            dto.setInBist50(i < 18);
            dto.setInBist100(true);
            list.add(dto);
            i++;
        }
        return list;
    }

    /** TEFAS fonları — Fintables kapalıyken kullanılır. */
    public List<FundDto> turkishFunds() {
        List<FundDto> list = new ArrayList<>();
        for (String code : FUNDS.keySet()) {
            double price = priceOf(code, FUNDS);
            FundDto dto = new FundDto();
            dto.setSymbol(code);
            dto.setName(nameOf(code, FUNDS));
            dto.setAssetType("YATIRIM FONU");
            dto.setPrice(money(price));
            dto.setBuyPrice(money(price));
            dto.setChangePercent(money(dailyChange(code)));
            dto.setVolume(volumeOf(code));
            dto.setYahooSymbol(code);
            dto.setChartType("FUND");
            dto.setAssetCategory("TR_FUND");
            list.add(dto);
        }
        return list;
    }

    /** Yahoo kapalıyken istenen semboller için kotasyon üretir. */
    public List<MarketAssetDto> quotes(String[] symbols, String assetType) {
        List<MarketAssetDto> list = new ArrayList<>();
        if (symbols == null) return list;
        for (String symbol : symbols) {
            if (symbol == null || symbol.isBlank()) continue;
            double price = priceOf(symbol, GLOBAL);
            MarketAssetDto dto = new MarketAssetDto();
            dto.setSymbol(symbol);
            dto.setName(nameOf(symbol, GLOBAL));
            dto.setAssetType(assetType);
            dto.setPrice(money(price));
            dto.setBuyPrice(money(price * 0.999));
            dto.setChangePercent(money(dailyChange(symbol)));
            dto.setVolume(volumeOf(symbol));
            dto.setYahooSymbol(symbol);
            list.add(dto);
        }
        return list;
    }

    /** VİOP kontratları — İş Yatırım kapalıyken kullanılır. */
    public List<ViopDto> viopContracts() {
        String[] underlyings = {"THYAO", "GARAN", "ASELS", "AKBNK", "EREGL",
                                "KCHOL", "SISE", "TUPRS", "PETKM", "SOKM"};
        List<ViopDto> list = new ArrayList<>();
        for (String u : underlyings) {
            String name = u + " Ekim 2026 Vadeli";
            double price = priceOf(u, BIST) * 1.01;   // vadeli genelde spotun hafif üstünde
            ViopDto dto = new ViopDto();
            dto.setSymbol(name);
            dto.setName(name);
            dto.setAssetType("VİOP");
            dto.setPrice(money(price));
            dto.setChangePercent(money(dailyChange(name)));
            dto.setVolume(volumeOf(name));
            dto.setYahooSymbol(name);
            dto.setChartType("VIOP");
            dto.setAssetCategory("VIOP");
            dto.setContractSize(BigDecimal.valueOf(100));
            list.add(dto);
        }
        return list;
    }

    /**
     * Grafik geçmişi — rastgele yürüyüş. Bitiş noktası bugünkü fiyata yakın olur,
     * böylece liste ile grafik tutarlı görünür.
     *
     * @param range 1mo/3mo/6mo/1y gibi; tanınmayan değerlerde 3 ay varsayılır.
     */
    public List<HistoricalDataDto> history(String symbol, String range) {
        int days = switch (range == null ? "" : range.toLowerCase()) {
            case "1mo", "1m", "1a" -> 30;
            case "6mo", "6m", "6a" -> 180;
            case "1y", "1yil" -> 365;
            case "5y" -> 900;
            default -> 90;
        };

        double end = priceOf(symbol, BIST.containsKey(stripSuffix(symbol)) ? BIST
                : FUNDS.containsKey(stripSuffix(symbol)) ? FUNDS : GLOBAL);
        Random r = rng(symbol, "hist");

        // Sondan başa yürüyüp listeyi ters çeviriyoruz: son bar bugünkü fiyata eşit olsun.
        List<Double> closes = new ArrayList<>();
        double p = end;
        for (int i = 0; i < days; i++) {
            closes.add(p);
            p = p / (1 + ((r.nextDouble() * 3.0) - 1.5) / 100.0);   // günlük ±%1,5
        }

        List<HistoricalDataDto> out = new ArrayList<>();
        LocalDate day = LocalDate.now(ZoneOffset.UTC).minusDays(days);
        for (int i = closes.size() - 1; i >= 0; i--) {
            double close = closes.get(i);
            double open = close * (1 + ((r.nextDouble() * 1.0) - 0.5) / 100.0);
            double high = Math.max(open, close) * (1 + r.nextDouble() / 100.0);
            double low = Math.min(open, close) * (1 - r.nextDouble() / 100.0);

            HistoricalDataDto bar = new HistoricalDataDto();
            bar.setDate(day);
            bar.setTimestamp(day.atStartOfDay(ZoneOffset.UTC).toEpochSecond());
            bar.setOpen(money(open));
            bar.setHigh(money(high));
            bar.setLow(money(low));
            bar.setClose(money(close));
            bar.setPrice(money(close));
            bar.setVolume(volumeOf(symbol + i));
            out.add(bar);
            day = day.plusDays(1);
        }
        return out;
    }
}
