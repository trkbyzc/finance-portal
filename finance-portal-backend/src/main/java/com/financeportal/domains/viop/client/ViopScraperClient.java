package com.financeportal.domains.viop.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.financeportal.domains.viop.dto.ViopDto;
import com.financeportal.model.dto.market.HistoricalDataDto;
import com.financeportal.demo.DemoMarketData;
import com.financeportal.config.datasource.DataSourceKeys;
import com.financeportal.config.datasource.DataSourcePolicy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Component
@RequiredArgsConstructor
@Slf4j
public class ViopScraperClient {

    private final DataSourcePolicy dataSourcePolicy;
    private final DemoMarketData demoMarketData;

    public List<ViopDto> scrapeViopData() {
        // Kaynak bu ortamda sunulmuyorsa dis cagri hic yapilmaz.
        // Canli demoda bu saglayiciya istek atilmaz; yerine uretilmis veri doner.
        if (dataSourcePolicy.useDemoData(DataSourceKeys.ISYATIRIM)) return demoMarketData.viopContracts();
        dataSourcePolicy.check(DataSourceKeys.ISYATIRIM);

        long startTime = System.currentTimeMillis();
        List<ViopDto> viopList = new ArrayList<>();
        try {
            Document doc = Jsoup.connect("https://www.isyatirim.com.tr/tr-tr/analiz/Sayfalar/viop.aspx").userAgent("Mozilla/5.0").timeout(20000).get();
            Elements rows = doc.select("table tbody tr");
            for (Element row : rows) {
                Elements cols = row.select("td");
                if (cols.size() >= 5) {
                    String fullName = cols.get(0).text().trim();
                    String upperName = fullName.toUpperCase(new Locale("tr", "TR"));

                    if (!fullName.isEmpty()) {
                        // Opsiyon satırlarını atla; yalnızca vadeli işlem (futures) kontratlarını işle
                        if (upperName.contains("ALIM") || upperName.contains("SATIM") || upperName.matches(".*\\sC\\s.*") || upperName.matches(".*\\sP\\s.*") || upperName.contains("OPSİYON") || upperName.contains("PUT") || upperName.contains("CALL")) continue;
                        // Vade ifadesi içermeyen satırlar tablo başlığı veya grup etiketi; geç
                        if (!upperName.contains("VADE") && !upperName.matches(".*(OCAK|ŞUBAT|MART|NİSAN|MAYIS|HAZİRAN|TEMMUZ|AĞUSTOS|EYLÜL|EKİM|KASIM|ARALIK).*")) continue;

                        String priceStr = cols.get(1).text().replace(".", "").replace(",", ".").trim();
                        String changeStr = cols.get(2).text().replace("%", "").replace(",", ".").trim();
                        if (priceStr.equals("-") || priceStr.isEmpty()) priceStr = "0";
                        if (changeStr.equals("-") || changeStr.isEmpty()) changeStr = "0";

                        if (isNumeric(priceStr) && isNumeric(changeStr)) {
                            ViopDto dto = new ViopDto();
                            dto.setAssetType("VIOP");
                            dto.setChartType("CANDLE");
                            dto.setAssetCategory("VIOP");
                            dto.setPrice(new BigDecimal(priceStr));
                            dto.setChangePercent(new BigDecimal(changeStr));
                            dto.setVolume(0L);
                            String baseStockCode = fullName.split(" ")[0].trim();
                            dto.setSymbol(fullName);
                            dto.setName(fullName);
                            // Endeks/emtia/döviz bazlı kontratlar Yahoo sembolünde ".IS" suffix almaz
                            dto.setYahooSymbol((baseStockCode.equals("BİST") || baseStockCode.equals("ONS") || baseStockCode.equals("DOLAR/TL") || baseStockCode.equals("EURO/TL")) ? baseStockCode : baseStockCode + ".IS");
                            viopList.add(dto);
                        }
                    }
                }
            }
            log.info("[SCRAPER_VIOP] Successfully scraped {} VIOP contracts in {} ms.", viopList.size(), (System.currentTimeMillis() - startTime));
        } catch (Exception e) {
            log.error("[SCRAPER_VIOP] Failed to scrape live VIOP data: {}", e.getMessage());
        }
        return viopList;
    }

    public List<HistoricalDataDto> fetchViopHistoryFromIsYatirim(String fullName, String range) {
        // Kaynak bu ortamda sunulmuyorsa dis cagri hic yapilmaz.
        // Canli demoda bu saglayiciya istek atilmaz; yerine uretilmis veri doner.
        if (dataSourcePolicy.useDemoData(DataSourceKeys.ISYATIRIM)) return demoMarketData.history(fullName, range);
        dataSourcePolicy.check(DataSourceKeys.ISYATIRIM);

        List<HistoricalDataDto> history = new ArrayList<>();
        try {
            String viopSymbol = convertToIsYatirimFormat(fullName);
            if (viopSymbol == null) return history;

            String period = "1440";
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime fromDate = now.minusYears(1);

            switch (range.toLowerCase()) {
                case "1d": period = "5"; fromDate = now.minusDays(1); break;
                case "1w": period = "60"; fromDate = now.minusDays(7); break;
                case "1mo": period = "60"; fromDate = now.minusMonths(1); break;
                case "3mo": period = "1440"; fromDate = now.minusMonths(3); break;
                case "6mo": period = "1440"; fromDate = now.minusMonths(6); break;
                case "1y": period = "1440"; fromDate = now.minusYears(1); break;
            }

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
            String url = String.format("https://www.isyatirim.com.tr/_layouts/15/IsYatirim.Website/Common/ChartData.aspx/IndexHistoricalAll?period=%s&from=%s&to=%s&endeks=%s", period, fromDate.format(formatter), now.format(formatter), viopSymbol);

            String jsonResponse = Jsoup.connect(url).ignoreContentType(true).userAgent("Mozilla/5.0").execute().body();
            JsonNode dataNode = new ObjectMapper().readTree(jsonResponse).path("data");

            if (dataNode.isArray()) {
                for (JsonNode point : dataNode) {
                    HistoricalDataDto dto = new HistoricalDataDto();
                    dto.setTimestamp(point.get(0).asLong());
                    BigDecimal price = BigDecimal.valueOf(point.get(1).asDouble());
                    // IsYatirim chart endpoint tek fiyat noktası döndürür; OHLC aynı değere eşitlenir
                    dto.setOpen(price); dto.setHigh(price); dto.setLow(price); dto.setClose(price); dto.setVolume(0L);
                    history.add(dto);
                }
            }
            history.sort(Comparator.comparingLong(HistoricalDataDto::getTimestamp));
        } catch (Exception e) {
            log.error("[SCRAPER_VIOP_CHART] Failed to fetch history for {}: {}", fullName, e.getMessage());
        }
        return history;
    }

    /** IsYatirim grafik API'sinin beklediği "F_<BASE><MM><YY>" formatına çevirir (örn. "XU030 HAZİRAN 2025 VADELI" → "F_XU03006025"). */
    private String convertToIsYatirimFormat(String fullName) {
        try {
            fullName = fullName.toUpperCase(new Locale("tr", "TR"));
            if (fullName.startsWith("F_")) return fullName;
            String base = "";
            if (fullName.contains("BİST 30") || fullName.contains("XU030")) base = "XU030";
            else if (fullName.contains("DOLAR/TL")) base = "USDTRY";
            else if (fullName.contains("ONS ALTIN")) base = "XAUUSD";
            else if (fullName.contains("EURO/TL")) base = "EURTRY";
            else if (fullName.contains("EURO/DOLAR")) base = "EURUSD";
            else if (fullName.contains("STERLİN/DOLAR")) base = "GBPUSD";
            else if (fullName.contains("GRAM ALTIN")) base = "XAUTRY";
            else if (fullName.contains("GÜMÜŞ")) base = "XAGUSD";
            else base = fullName.split(" ")[0];

            String month = "06";
            // IsYatirim bazen Türkçe özel karaktersiz yazar (ğ→g, ş→s, ü→u vb.); her ayın ASCII karşılığı da kontrol edilir
            String[] months = {"OCAK", "ŞUBAT", "SUBAT", "MART", "NİSAN", "NISAN", "MAYIS", "HAZİRAN", "TEMMUZ", "AĞUSTOS", "AGUSTOS", "EYLÜL", "EYLUL", "EKİM", "EKIM", "KASIM", "ARALIK"};
            for (String m : months) { if (fullName.contains(m)) { month = getMonthCode(m); break; } }
            String year = String.valueOf(LocalDateTime.now().getYear()).substring(2);
            for (String part : fullName.split(" ")) { if (part.matches("\\d{4}")) { year = part.substring(2); break; } }
            return "F_" + base + month + year;
        // Parse hatası durumunda orijinal adı döndür; upstream log zaten hatayı yakalar
        } catch (Exception e) { return fullName; }
    }

    private String getMonthCode(String monthName) {
        return switch (monthName) { case "OCAK" -> "01"; case "ŞUBAT", "SUBAT" -> "02"; case "MART" -> "03"; case "NİSAN", "NISAN" -> "04"; case "MAYIS" -> "05"; case "HAZİRAN" -> "06"; case "TEMMUZ" -> "07"; case "AĞUSTOS", "AGUSTOS" -> "08"; case "EYLÜL", "EYLUL" -> "09"; case "EKİM", "EKIM" -> "10"; case "KASIM" -> "11"; case "ARALIK" -> "12"; default -> "06"; };
    }
    private boolean isNumeric(String str) { try { new BigDecimal(str); return true; } catch(Exception e) { return false; } }
}