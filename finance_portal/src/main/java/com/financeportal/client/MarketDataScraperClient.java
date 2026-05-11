package com.financeportal.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.financeportal.model.dto.HistoricalDataDto;
import com.financeportal.model.dto.MarketAssetDto;
import com.financeportal.service.cache.CacheService;
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
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class MarketDataScraperClient {

    private final CacheService cacheService;

    public List<Map<String, Object>> scrapeIPOCalendar() {
        long startTime = System.currentTimeMillis();
        List<Map<String, Object>> ipoList = new ArrayList<>();
        try {
            Document doc = Jsoup.connect("https://halkarz.com/")
                    .userAgent("Mozilla/5.0")
                    .timeout(30000)
                    .get();

            Elements rows = doc.select("article.halka-arz");
            for (Element row : rows) {
                String name = row.select("h3.title").text();
                String date = row.select(".il-tarih").text();
                String priceStr = row.select(".il-fiyat").text();
                if (name != null && !name.isEmpty() && !name.toLowerCase().contains("sonuçlandı")) {
                    ipoList.add(Map.of(
                            "name", name,
                            "date", date.isEmpty() ? "Tarih Bekleniyor" : date,
                            "price", priceStr.isEmpty() ? "Belirsiz" : priceStr,
                            "status", "Talep Toplama Bekleniyor"
                    ));
                }
            }
            log.info("[SCRAPER_IPO] Successfully scraped {} IPO entries in {} ms.", ipoList.size(), (System.currentTimeMillis() - startTime));
        } catch (Exception e) {
            log.error("[SCRAPER_IPO] Failed to scrape IPO calendar: {}", e.getMessage());
        }
        return ipoList;
    }

    public List<MarketAssetDto> scrapeViopData() {
        long startTime = System.currentTimeMillis();
        List<MarketAssetDto> viopList = new ArrayList<>();
        try {
            Document doc = Jsoup.connect("https://www.isyatirim.com.tr/tr-tr/analiz/Sayfalar/viop.aspx")
                    .userAgent("Mozilla/5.0")
                    .timeout(20000)
                    .get();

            Elements rows = doc.select("table tbody tr");
            for (Element row : rows) {
                Elements cols = row.select("td");
                if (cols.size() >= 5) {
                    String fullName = cols.get(0).text().trim();
                    String upperName = fullName.toUpperCase(new Locale("tr", "TR"));

                    if (!fullName.isEmpty()) {
                        if (upperName.contains("ALIM") || upperName.contains("SATIM") ||
                                upperName.matches(".*\\sC\\s.*") || upperName.matches(".*\\sP\\s.*") ||
                                upperName.contains("OPSİYON") || upperName.contains("PUT") || upperName.contains("CALL")) {
                            continue;
                        }

                        if (!upperName.contains("VADE") && !upperName.matches(".*(OCAK|ŞUBAT|MART|NİSAN|MAYIS|HAZİRAN|TEMMUZ|AĞUSTOS|EYLÜL|EKİM|KASIM|ARALIK).*")) {
                            continue;
                        }

                        String priceStr = cols.get(1).text().replace(".", "").replace(",", ".").trim();
                        String changeStr = cols.get(2).text().replace("%", "").replace(",", ".").trim();

                        if (priceStr.equals("-") || priceStr.isEmpty()) priceStr = "0";
                        if (changeStr.equals("-") || changeStr.isEmpty()) changeStr = "0";

                        if (isNumeric(priceStr) && isNumeric(changeStr)) {
                            MarketAssetDto dto = new MarketAssetDto();
                            dto.setAssetType("VIOP");
                            dto.setChartType("CANDLE");
                            dto.setAssetCategory("VIOP");
                            dto.setPrice(new BigDecimal(priceStr));
                            dto.setChangePercent(new BigDecimal(changeStr));
                            dto.setVolume(0L);

                            String baseStockCode = fullName.split(" ")[0].trim();
                            dto.setSymbol(fullName);
                            dto.setName(fullName);

                            if (baseStockCode.equals("BİST") || baseStockCode.equals("ONS") || baseStockCode.equals("DOLAR/TL") || baseStockCode.equals("EURO/TL")) {
                                dto.setYahooSymbol(baseStockCode);
                            } else {
                                dto.setYahooSymbol(baseStockCode + ".IS");
                            }
                            viopList.add(dto);
                        }
                    }
                }
            }
            log.info("[SCRAPER_VIOP] Successfully scraped {} VIOP contracts in {} ms.", viopList.size(), (System.currentTimeMillis() - startTime));
            return viopList;
        } catch (Exception e) {
            log.error("[SCRAPER_VIOP] Failed to scrape live VIOP data: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    public List<HistoricalDataDto> fetchViopHistoryFromIsYatirim(String fullName, String range) {
        long startTime = System.currentTimeMillis();
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
            String url = String.format(
                    "https://www.isyatirim.com.tr/_layouts/15/IsYatirim.Website/Common/ChartData.aspx/IndexHistoricalAll?period=%s&from=%s&to=%s&endeks=%s",
                    period, fromDate.format(formatter), now.format(formatter), viopSymbol
            );

            String jsonResponse = Jsoup.connect(url).ignoreContentType(true).userAgent("Mozilla/5.0").execute().body();
            ObjectMapper mapper = new ObjectMapper();
            JsonNode dataNode = mapper.readTree(jsonResponse).path("data");

            if (dataNode.isArray()) {
                for (JsonNode point : dataNode) {
                    HistoricalDataDto dto = new HistoricalDataDto();
                    dto.setTimestamp(point.get(0).asLong());
                    BigDecimal price = BigDecimal.valueOf(point.get(1).asDouble());
                    dto.setOpen(price);
                    dto.setHigh(price);
                    dto.setLow(price);
                    dto.setClose(price);
                    dto.setVolume(0L);
                    history.add(dto);
                }
            }
            history.sort(Comparator.comparingLong(HistoricalDataDto::getTimestamp));
            log.debug("[SCRAPER_VIOP_CHART] Fetched {} historical points for {} in {} ms.", history.size(), fullName, (System.currentTimeMillis() - startTime));
        } catch (Exception e) {
            log.error("[SCRAPER_VIOP_CHART] Failed to fetch history for {}: {}", fullName, e.getMessage());
        }
        return history;
    }

    private String convertToIsYatirimFormat(String fullName) {
        try {
            fullName = fullName.toUpperCase(new Locale("tr", "TR"));
            if (fullName.startsWith("F_")) return fullName;

            String base = "";
            if (fullName.contains("BİST 30") || fullName.contains("BIST 30") || fullName.contains("XU030")) base = "XU030";
            else if (fullName.contains("DOLAR/TL") || fullName.contains("USDTRY")) base = "USDTRY";
            else if (fullName.contains("ONS ALTIN") || fullName.contains("XAU")) base = "XAUUSD";
            else if (fullName.contains("EURO/TL") || fullName.contains("EURTRY")) base = "EURTRY";
            else if (fullName.contains("EURO/DOLAR") || fullName.contains("EURUSD")) base = "EURUSD";
            else if (fullName.contains("STERLİN/DOLAR") || fullName.contains("GBPUSD")) base = "GBPUSD";
            else if (fullName.contains("GRAM ALTIN")) base = "XAUTRY";
            else if (fullName.contains("GÜMÜŞ") || fullName.contains("XAG")) base = "XAGUSD";
            else base = fullName.split(" ")[0];

            String month = "06";
            String[] months = {"OCAK", "ŞUBAT", "MART", "NİSAN", "MAYIS", "HAZİRAN", "TEMMUZ", "AĞUSTOS", "EYLÜL", "EKİM", "KASIM", "ARALIK"};
            for (String m : months) {
                if (fullName.contains(m)) {
                    month = getMonthCode(m);
                    break;
                }
            }

            String year = String.valueOf(LocalDateTime.now().getYear()).substring(2);
            String[] parts = fullName.split(" ");
            for (String part : parts) {
                if (part.matches("\\d{4}")) {
                    year = part.substring(2);
                    break;
                }
            }
            return "F_" + base + month + year;
        } catch (Exception e) {
            return fullName;
        }
    }

    private String getMonthCode(String monthName) {
        switch (monthName) {
            case "OCAK": return "01"; case "ŞUBAT": return "02"; case "MART": return "03";
            case "NİSAN": return "04"; case "MAYIS": return "05"; case "HAZİRAN": return "06";
            case "TEMMUZ": return "07"; case "AĞUSTOS": return "08"; case "EYLÜL": return "09";
            case "EKİM": return "10"; case "KASIM": return "11"; case "ARALIK": return "12";
            default: return "06";
        }
    }

    private boolean isNumeric(String str) {
        try { new BigDecimal(str); return true; } catch(Exception e) { return false; }
    }
}