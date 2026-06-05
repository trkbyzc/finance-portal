package com.financeportal.domains.stock.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.financeportal.domains.stock.client.IsYatirimFundamentalsClient;
import com.financeportal.domains.stock.client.TradingViewLogoClient;
import com.financeportal.domains.stock.dto.StockFundamentalsDto;
import com.financeportal.util.HttpHeadersUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

/**
 * Hisse detay sayfası "Temel Veriler" kartı için veri toplayıcı.
 * Yahoo chart meta (aralık/hacim/önceki kapanış) + İş Yatırım Özet (piyasa değeri/halka açıklık/sermaye/sektör).
 * Her iki kaynak da best-effort: biri başarısızsa diğeri yine döner, alanlar null kalır.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class StockFundamentalsService {

    private final RestTemplate restTemplate;
    private final IsYatirimFundamentalsClient isyClient;
    private final TradingViewLogoClient logoClient;

    public StockFundamentalsDto getFundamentals(String symbol) {
        if (symbol == null || symbol.isBlank()) return null;
        final String sym = symbol.trim().toUpperCase();
        StockFundamentalsDto.StockFundamentalsDtoBuilder b = StockFundamentalsDto.builder().symbol(sym);

        // 1) Yahoo chart meta — auth gerektirmeyen /v8/finance/chart meta node'u
        try {
            HttpEntity<String> entity = new HttpEntity<>(HttpHeadersUtil.getYahooFinanceHeaders());
            String url = "https://query1.finance.yahoo.com/v8/finance/chart/" + sym + "?range=1d&interval=1d";
            ResponseEntity<JsonNode> res = restTemplate.exchange(url, HttpMethod.GET, entity, JsonNode.class);
            JsonNode result = res.getBody() != null ? res.getBody().path("chart").path("result") : null;
            if (result != null && result.isArray() && result.size() > 0) {
                JsonNode meta = result.get(0).path("meta");
                b.price(dbl(meta, "regularMarketPrice"))
                 .previousClose(dbl(meta, "chartPreviousClose"))
                 .dayLow(dbl(meta, "regularMarketDayLow"))
                 .dayHigh(dbl(meta, "regularMarketDayHigh"))
                 .week52Low(dbl(meta, "fiftyTwoWeekLow"))
                 .week52High(dbl(meta, "fiftyTwoWeekHigh"))
                 .volume(meta.path("regularMarketVolume").asLong(0L))
                 .currency(txt(meta, "currency"))
                 .longName(txt(meta, "longName") != null ? txt(meta, "longName") : txt(meta, "shortName"));
            }
        } catch (Exception e) {
            log.warn("[STOCK-FUND] Yahoo meta {} alınamadı: {}", sym, e.getMessage());
        }

        // 2) Temel oranlar: BİST → İş Yatırım Özet; ABD → TradingView scanner.
        if (sym.endsWith(".IS")) {
            try {
                String code = sym.substring(0, sym.indexOf('.'));
                IsYatirimFundamentalsClient.Fundamentals f = isyClient.get(code);
                if (f != null) {
                    b.sector(f.sector())
                     .marketCapTl(f.marketCapTl())
                     .marketCapUsd(f.marketCapUsd())
                     .freeFloatPct(f.freeFloatPct())
                     .capital(f.capital());
                }
            } catch (Exception e) {
                log.warn("[STOCK-FUND] İş Yatırım {} alınamadı: {}", sym, e.getMessage());
            }
        } else {
            // ABD hissesi: piyasa değeri (USD), sektör, halka açıklık — TradingView scanner.
            // ₺ piyasa değeri / sermaye ABD şirketi için anlamsız → null bırakılır (kart gizlenir).
            try {
                TradingViewLogoClient.UsFundamentals uf = logoClient.usFundamentals(sym);
                if (uf != null) {
                    b.sector(uf.sector())
                     .marketCapUsd(uf.marketCapUsd())
                     .freeFloatPct(uf.freeFloatPct());
                }
            } catch (Exception e) {
                log.warn("[STOCK-FUND] ABD temel verisi {} alınamadı: {}", sym, e.getMessage());
            }
        }

        return b.build();
    }

    private static Double dbl(JsonNode n, String k) {
        return n.has(k) && !n.path(k).isNull() ? n.path(k).asDouble() : null;
    }

    private static String txt(JsonNode n, String k) {
        return n.has(k) && !n.path(k).isNull() ? n.path(k).asText() : null;
    }
}
