package com.financeportal.domains.eurobond.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.financeportal.model.dto.market.HistoricalDataDto;
import com.financeportal.util.HttpHeadersUtil;
import lombok.Builder;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * businessinsider.com bono istemcisi — Türkiye Hazine eurobondları için.
 *
 * İki işlev:
 *   1) {@link #fetchDetail(String)} — bono detay HTML'ini çekip kupon/vade/getiri/fiyat/değişim/
 *      döviz/tkData alanlarını regex ile parse eder (tek istek). Site markup'ı değişirse alanlar
 *      null kalır ama akış kırılmaz (null-safe).
 *   2) {@link #fetchChart(String, String)} — Chart_GetChartData JSON'ını çekip area grafik için
 *      {@link HistoricalDataDto} listesine dönüştürür.
 */
@Component
@Slf4j
public class BusinessInsiderBondClient {

    private final RestTemplate restTemplate;

    @Value("${external-api.businessinsider.base-url}")
    private String baseUrl;

    public BusinessInsiderBondClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    private static final Pattern P_TKDATA = Pattern.compile("TKData\"\\s*:\\s*\"([0-9,]+)\"");
    private static final Pattern P_CURRENCY = Pattern.compile("\"Currency\"\\s*:\\s*\"([A-Z]{3})\"");
    private static final Pattern P_COUPON = Pattern.compile("coupon of\\s*([0-9.,]+)\\s*%", Pattern.CASE_INSENSITIVE);
    private static final Pattern P_YIELD = Pattern.compile("yield of\\s*([0-9.,]+)\\s*%", Pattern.CASE_INSENSITIVE);
    private static final Pattern P_MATURITY = Pattern.compile("maturity date of\\s*(\\d{1,2}/\\d{1,2}/\\d{4})", Pattern.CASE_INSENSITIVE);
    private static final Pattern P_PRICE = Pattern.compile("price-section__current-value\">\\s*([0-9.,]+)");
    private static final Pattern P_CHANGE = Pattern.compile("price-section__relative-value\">\\s*([+-]?[0-9.,]+)\\s*%");
    private static final DateTimeFormatter US_DATE = DateTimeFormatter.ofPattern("M/d/yyyy", Locale.ENGLISH);

    public BusinessInsiderBondDetail fetchDetail(String slug) {
        if (slug == null || slug.isBlank()) return null;
        try {
            String url = String.format("%s/bonds/%s", baseUrl, slug);
            HttpEntity<Void> entity = new HttpEntity<>(HttpHeadersUtil.getStandardHeaders());
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
            String html = response.getBody();
            if (html == null || html.isEmpty()) return null;

            BusinessInsiderBondDetail detail = BusinessInsiderBondDetail.builder()
                    .tkData(group(P_TKDATA, html))
                    .currency(group(P_CURRENCY, html))
                    .coupon(decimal(group(P_COUPON, html)))
                    .bondYield(decimal(group(P_YIELD, html)))
                    .price(decimal(group(P_PRICE, html)))
                    .changePercent(decimal(group(P_CHANGE, html)))
                    .maturity(parseMaturity(group(P_MATURITY, html)))
                    .build();

            log.debug("[BI-BOND] Detay parse: slug={} tk={} price={} yield={}",
                    slug, detail.getTkData(), detail.getPrice(), detail.getBondYield());
            return detail;
        } catch (Exception e) {
            log.warn("[BI-BOND] Detay çekilemedi (slug={}): {}", slug, e.getMessage());
            return null;
        }
    }

    public List<HistoricalDataDto> fetchChart(String tkData, String range) {
        List<HistoricalDataDto> list = new ArrayList<>();
        if (tkData == null || tkData.isBlank()) return list;
        try {
            LocalDate to = LocalDate.now();
            LocalDate from = fromDateForRange(range, to);
            String url = String.format("%s/Ajax/Chart_GetChartData?instrumentType=Bond&tkData=%s&from=%s&to=%s",
                    baseUrl, tkData,
                    from.format(DateTimeFormatter.BASIC_ISO_DATE),
                    to.format(DateTimeFormatter.BASIC_ISO_DATE));

            HttpEntity<Void> entity = new HttpEntity<>(HttpHeadersUtil.getStandardHeaders());
            ResponseEntity<JsonNode> response = restTemplate.exchange(url, HttpMethod.GET, entity, JsonNode.class);
            JsonNode body = response.getBody();
            if (body == null || !body.isArray()) return list;

            for (JsonNode point : body) {
                String dateStr = point.path("Date").asText(null);
                BigDecimal close = decimal(point.path("Close").asText(null));
                // Geçersiz tarih veya kapanış yoksa nokta tamamen atlanır.
                if (dateStr == null || dateStr.length() < 10 || close == null) {
                    continue;
                }
                HistoricalDataDto dto = new HistoricalDataDto();
                dto.setDate(LocalDate.parse(dateStr.substring(0, 10)));
                dto.setClose(close);
                dto.setPrice(close);
                dto.setOpen(nonZero(decimal(point.path("Open").asText(null))));
                dto.setHigh(nonZero(decimal(point.path("High").asText(null))));
                dto.setLow(nonZero(decimal(point.path("Low").asText(null))));
                list.add(dto);
            }
            log.info("[BI-BOND] {} grafik noktası (tk={}, range={}).", list.size(), tkData, range);
        } catch (Exception e) {
            log.warn("[BI-BOND] Grafik çekilemedi (tk={}): {}", tkData, e.getMessage());
        }
        return list;
    }

    private LocalDate fromDateForRange(String range, LocalDate to) {
        if (range == null) return to.minusYears(1);
        return switch (range.toLowerCase(Locale.ENGLISH)) {
            case "1mo", "1m", "1a" -> to.minusMonths(1);
            case "3mo", "3m", "3a" -> to.minusMonths(3);
            case "6mo", "6m", "6a" -> to.minusMonths(6);
            case "1y", "ytd" -> to.minusYears(1);
            case "5y" -> to.minusYears(5);
            case "all", "max" -> LocalDate.of(1970, 1, 1);
            default -> to.minusYears(1);
        };
    }

    private static String group(Pattern p, String html) {
        Matcher m = p.matcher(html);
        return m.find() ? m.group(1) : null;
    }

    /** "6.3750", "+0.39", "1,234.56" → BigDecimal (binlik ',' atılır; null/parse hatası → null). */
    private static BigDecimal decimal(String raw) {
        if (raw == null || raw.isBlank()) return null;
        String cleaned = raw.replace(",", "").replace("+", "").trim();
        try {
            return new BigDecimal(cleaned);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /** Grafik OHLC alanlarında 0, "veri yok" demek — null'a çevir ki frontend kafa karıştırmasın. */
    private static BigDecimal nonZero(BigDecimal v) {
        return (v == null || v.signum() == 0) ? null : v;
    }

    /** "5/22/2031" → "2031-05-22" (parse edilemezse null). */
    private static String parseMaturity(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return LocalDate.parse(raw.trim(), US_DATE).toString();
        } catch (Exception e) {
            return null;
        }
    }

    @Data
    @Builder
    public static class BusinessInsiderBondDetail {
        private String tkData;
        private String currency;
        private BigDecimal coupon;
        private BigDecimal bondYield;
        private BigDecimal price;
        private BigDecimal changePercent;
        private String maturity; // "yyyy-MM-dd"
    }
}
