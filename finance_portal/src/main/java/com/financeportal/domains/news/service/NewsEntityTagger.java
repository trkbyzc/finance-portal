package com.financeportal.domains.news.service;

import com.financeportal.domains.news.dto.NewsDto;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Haber metnindeki şirket/varlık adlarını tespit edip habere "ilgili varlık" etiketi ekler
 * (relatedSymbol / relatedName / relatedCategory). Böylece haber → varlık grafiği navigasyonu
 * ve varlık detayında "İlgili Haberler" filtresi mümkün olur.
 *
 * Tasarım kararı: yüksek hassasiyet için KÜRATÖRLÜ alias listesi (Türk ekonomisi haberlerinde
 * fiilen adı geçen ~70 BİST hissesi + endeks + majör kripto + döviz). Eşleşme kelime-sınırı
 * kontrollüdür (Türkçe ekler boundary sayılır: "Aselsan'ın" → "aselsan" eşleşir, "garantili"
 * → "garanti" EŞLEŞMEZ). Önce başlıkta, sonra açıklamada aranır; en uzun alias kazanır.
 *
 * Makro haberler (enflasyon, faiz) spesifik bir varlığa bağlanmaz; onlar kategori düzeyinde kalır.
 */
@Component
public class NewsEntityTagger {

    public static final String STOCK = "STOCK";
    public static final String CRYPTO = "CRYPTO";
    public static final String CURRENCY = "CURRENCY";
    public static final String INDEX = "INDEX";

    public record Related(String symbol, String name, String category) {}

    private record AliasEntry(Pattern pattern, int length, Related related) {}

    private final List<AliasEntry> entries = new ArrayList<>();

    public NewsEntityTagger() {
        buildBistStocks();
        buildIndices();
        buildCrypto();
        buildCurrencies();
        // En uzun alias önce denensin (örn. "türk hava yolları" > "türk") → en spesifik eşleşme kazanır.
        entries.sort((a, b) -> Integer.compare(b.length(), a.length()));
    }

    /** Habere ilgili varlık etiketi ekler (varsa). Eşleşme yoksa alanlar null kalır. */
    public void tag(NewsDto news) {
        if (news == null) return;
        Related r = match(news.getTitle());
        if (r == null) r = match(news.getDescription());
        if (r != null) {
            news.setRelatedSymbol(r.symbol());
            news.setRelatedName(r.name());
            news.setRelatedCategory(r.category());
        }
    }

    private Related match(String text) {
        if (text == null || text.isBlank()) return null;
        String norm = fold(text);
        for (AliasEntry e : entries) {
            Matcher m = e.pattern().matcher(norm);
            if (m.find()) return e.related();
        }
        return null;
    }

    /**
     * Türkçe i/I sorununu çözen normalize: tr-lowercase + noktasız 'ı' → 'i'.
     * "BIST" → tr-lower "bıst" → fold "bist". Hem alias hem metne aynı uygulanır → tutarlı eşleşme.
     */
    private static String fold(String s) {
        return s.toLowerCase(Locale.of("tr", "TR")).replace('ı', 'i');
    }

    /** Verilen sembol+ad için alias kalıplarını kelime-sınırlı olarak ekler. */
    private void add(String category, String symbol, String name, String... aliases) {
        Related related = new Related(symbol, name, category);
        for (String alias : aliases) {
            String a = fold(alias).trim();
            // (?<![\p{L}0-9]) ... (?![\p{L}0-9]) → kelime sınırı (Türkçe harfler dahil).
            // Apostrof/boşluk/nokta sınır sayılır → "aselsan'ın", "aselsan." eşleşir.
            Pattern p = Pattern.compile("(?<![\\p{L}0-9])" + Pattern.quote(a) + "(?![\\p{L}0-9])");
            entries.add(new AliasEntry(p, a.length(), related));
        }
    }

    private void buildBistStocks() {
        // Bankalar
        add(STOCK, "GARAN.IS", "Garanti BBVA", "garanti bbva", "garanti bankası", "garanti");
        add(STOCK, "AKBNK.IS", "Akbank", "akbank");
        add(STOCK, "ISCTR.IS", "İş Bankası", "türkiye iş bankası", "iş bankası", "işbank");
        add(STOCK, "YKBNK.IS", "Yapı Kredi", "yapı kredi", "yapıkredi");
        add(STOCK, "VAKBN.IS", "VakıfBank", "vakıfbank", "vakıflar bankası");
        add(STOCK, "HALKB.IS", "Halkbank", "halkbank", "halk bankası");
        add(STOCK, "TSKB.IS", "TSKB", "tskb");
        // Holdingler
        add(STOCK, "KCHOL.IS", "Koç Holding", "koç holding");
        add(STOCK, "SAHOL.IS", "Sabancı Holding", "sabancı holding", "hacı ömer sabancı");
        add(STOCK, "DOHOL.IS", "Doğan Holding", "doğan holding");
        add(STOCK, "AGHOL.IS", "Anadolu Grubu Holding", "anadolu grubu holding");
        add(STOCK, "ALARK.IS", "Alarko Holding", "alarko");
        add(STOCK, "ENKAI.IS", "Enka İnşaat", "enka inşaat", "enka");
        add(STOCK, "GSDHO.IS", "GSD Holding", "gsd holding");
        // Sanayi / otomotiv / savunma
        add(STOCK, "ASELS.IS", "Aselsan", "aselsan");
        add(STOCK, "THYAO.IS", "Türk Hava Yolları", "türk hava yolları", "turkish airlines", "thy");
        add(STOCK, "PGSUS.IS", "Pegasus", "pegasus hava", "pegasus");
        add(STOCK, "TUPRS.IS", "Tüpraş", "tüpraş");
        add(STOCK, "EREGL.IS", "Ereğli Demir Çelik", "ereğli demir", "erdemir", "ereğli");
        add(STOCK, "KRDMD.IS", "Kardemir", "kardemir");
        add(STOCK, "FROTO.IS", "Ford Otosan", "ford otosan");
        add(STOCK, "TOASO.IS", "Tofaş", "tofaş");
        add(STOCK, "OTKAR.IS", "Otokar", "otokar");
        add(STOCK, "TTRAK.IS", "Türk Traktör", "türk traktör");
        add(STOCK, "ARCLK.IS", "Arçelik", "arçelik");
        add(STOCK, "VESTL.IS", "Vestel", "vestel");
        add(STOCK, "SISE.IS", "Şişecam", "şişecam", "şişe cam");
        add(STOCK, "PETKM.IS", "Petkim", "petkim");
        add(STOCK, "SASA.IS", "Sasa Polyester", "sasa polyester", "sasa");
        add(STOCK, "HEKTS.IS", "Hektaş", "hektaş");
        add(STOCK, "GUBRF.IS", "Gübre Fabrikaları", "gübre fabrikaları", "gübretaş");
        add(STOCK, "KORDS.IS", "Kordsa", "kordsa");
        add(STOCK, "KONTR.IS", "Kontrolmatik", "kontrolmatik");
        add(STOCK, "SMRTG.IS", "Smart Güneş", "smart güneş");
        add(STOCK, "ASTOR.IS", "Astor Enerji", "astor enerji", "astor");
        // Madencilik
        add(STOCK, "KOZAL.IS", "Koza Altın", "koza altın");
        add(STOCK, "KOZAA.IS", "Koza Anadolu", "koza anadolu");
        add(STOCK, "IPEKE.IS", "İpek Doğal Enerji", "ipek enerji");
        // Telekom / teknoloji
        add(STOCK, "TCELL.IS", "Turkcell", "turkcell");
        add(STOCK, "TTKOM.IS", "Türk Telekom", "türk telekom");
        add(STOCK, "LOGO.IS", "Logo Yazılım", "logo yazılım");
        add(STOCK, "KAREL.IS", "Karel Elektronik", "karel elektronik");
        // Enerji
        add(STOCK, "ENJSA.IS", "Enerjisa", "enerjisa");
        add(STOCK, "AKSEN.IS", "Aksa Enerji", "aksa enerji");
        add(STOCK, "ZOREN.IS", "Zorlu Enerji", "zorlu enerji");
        add(STOCK, "AYGAZ.IS", "Aygaz", "aygaz");
        add(STOCK, "TRGYO.IS", "Torunlar GYO", "torunlar gyo");
        // Perakende / gıda / içecek
        add(STOCK, "BIMAS.IS", "BİM", "bim mağazaları", "bim birleşik mağazalar");
        add(STOCK, "MGROS.IS", "Migros", "migros");
        add(STOCK, "SOKM.IS", "ŞOK Marketler", "şok marketler", "şok market");
        add(STOCK, "ULKER.IS", "Ülker", "ülker");
        add(STOCK, "CCOLA.IS", "Coca-Cola İçecek", "coca-cola içecek", "coca cola içecek");
        add(STOCK, "AEFES.IS", "Anadolu Efes", "anadolu efes");
        add(STOCK, "TATGD.IS", "Tat Gıda", "tat gıda");
        add(STOCK, "TUKAS.IS", "Tukaş", "tukaş");
        // Çimento / inşaat
        add(STOCK, "CIMSA.IS", "Çimsa", "çimsa");
        add(STOCK, "AKCNS.IS", "Akçansa", "akçansa");
        add(STOCK, "OYAKC.IS", "Oyak Çimento", "oyak çimento");
        // GYO
        add(STOCK, "EKGYO.IS", "Emlak Konut GYO", "emlak konut");
        add(STOCK, "ISGYO.IS", "İş GYO", "iş gyo");
    }

    private void buildIndices() {
        add(INDEX, "XU100", "BIST 100", "bist 100", "bist100", "bist-100", "bist 100 endeksi");
        add(INDEX, "XU030", "BIST 30", "bist 30", "bist30", "bist-30");
        add(INDEX, "XU050", "BIST 50", "bist 50", "bist50");
        add(INDEX, "XBANK", "BIST Bankacılık", "bist bankacılık", "bankacılık endeksi");
    }

    private void buildCrypto() {
        add(CRYPTO, "BTC", "Bitcoin", "bitcoin", "btc");
        add(CRYPTO, "ETH", "Ethereum", "ethereum", "ether", "eth");
        add(CRYPTO, "BNB", "BNB", "binance coin", "bnb");
        add(CRYPTO, "SOL", "Solana", "solana");
        add(CRYPTO, "XRP", "XRP", "ripple", "xrp");
        add(CRYPTO, "ADA", "Cardano", "cardano");
        add(CRYPTO, "DOGE", "Dogecoin", "dogecoin", "doge");
        add(CRYPTO, "AVAX", "Avalanche", "avalanche");
        add(CRYPTO, "TRX", "Tron", "tron");
        add(CRYPTO, "DOT", "Polkadot", "polkadot");
        add(CRYPTO, "SHIB", "Shiba Inu", "shiba inu", "shiba");
        add(CRYPTO, "LTC", "Litecoin", "litecoin");
        add(CRYPTO, "LINK", "Chainlink", "chainlink");
    }

    private void buildCurrencies() {
        add(CURRENCY, "USD", "Dolar", "amerikan doları", "dolar/tl", "dolar");
        add(CURRENCY, "EUR", "Euro", "euro/tl", "euro", "avro");
        add(CURRENCY, "GBP", "Sterlin", "ingiliz sterlini", "sterlin");
    }
}
