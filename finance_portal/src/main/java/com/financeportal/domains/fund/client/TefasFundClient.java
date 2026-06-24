package com.financeportal.domains.fund.client;

import com.financeportal.domains.fund.dto.FundDto;
import com.financeportal.model.dto.fintables.FintablesChartResponse;
import com.financeportal.model.dto.fintables.FintablesYieldResponse;
import com.financeportal.model.dto.market.HistoricalDataDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class TefasFundClient {

    private final RestTemplate restTemplate;

    // Fintables API bot kontrolünü aşmak için tarayıcı gibi görünen User-Agent ve Referer zorunlu.
    private HttpHeaders getHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
        headers.set("Referer", "https://fintables.com/");
        return headers;
    }

    public List<FundDto> fetchTefasFunds() {
        long startTime = System.currentTimeMillis();
        try {
            String url = "https://api.fintables.com/funds/yield/?fund_type=mutual&tefas=true";
            HttpEntity<String> entity = new HttpEntity<>(getHeaders());
            ResponseEntity<FintablesYieldResponse> response = restTemplate.exchange(url, HttpMethod.GET, entity, FintablesYieldResponse.class);

            if (response.getBody() != null && response.getBody().getResults() != null) {
                List<FundDto> funds = response.getBody().getResults().stream()
                        .filter(r -> r != null && r.getCode() != null && !r.getCode().isBlank())
                        .map(r -> {
                            FundDto dto = new FundDto();
                            dto.setSymbol(r.getCode()); dto.setYahooSymbol(r.getCode());
                            dto.setName(r.getTitle()); dto.setAssetType("YATIRIM FONU (TEFAS)");
                            dto.setPrice(r.getPrice() != null ? r.getPrice() : BigDecimal.ZERO);
                            dto.setChangePercent(r.getYield_1m() != null ? r.getYield_1m() : BigDecimal.ZERO);
                            dto.setVolume(0L); dto.setAssetCategory("FUND"); dto.setChartType("LINE");
                            return dto;
                        }).toList();
                log.info("[TEFAS_FUND] Fetched {} funds in {} ms.", funds.size(), (System.currentTimeMillis() - startTime));
                return funds;
            }
        } catch (Exception e) {
            log.error("[TEFAS_FUND] Failed to fetch TEFAS funds: {}", e.getMessage());
        }
        return new ArrayList<>();
    }

    public List<HistoricalDataDto> fetchFundHistory(String symbol, String range) {
        List<HistoricalDataDto> historyList = new ArrayList<>();
        try {
            long to = Instant.now().getEpochSecond();
            long from;
            String safeRange = (range != null) ? range.toLowerCase() : "1y";

            switch (safeRange) {
                case "1w": from = Instant.now().minus(7, java.time.temporal.ChronoUnit.DAYS).getEpochSecond(); break;
                case "1mo": from = Instant.now().minus(30, java.time.temporal.ChronoUnit.DAYS).getEpochSecond(); break;
                case "3mo": from = Instant.now().minus(90, java.time.temporal.ChronoUnit.DAYS).getEpochSecond(); break;
                case "6mo": from = Instant.now().minus(180, java.time.temporal.ChronoUnit.DAYS).getEpochSecond(); break;
                case "ytd": from = LocalDate.now().withDayOfYear(1).atStartOfDay(ZoneId.systemDefault()).toEpochSecond(); break;
                case "3y": from = Instant.now().minus(365L * 3, java.time.temporal.ChronoUnit.DAYS).getEpochSecond(); break;
                case "5y": from = Instant.now().minus(365L * 5, java.time.temporal.ChronoUnit.DAYS).getEpochSecond(); break;
                default: from = Instant.now().minus(365, java.time.temporal.ChronoUnit.DAYS).getEpochSecond(); break;
            }

            String url = String.format("https://markets.fintables.com/barbar/udf/history?symbol=%s&resolution=D&from=%d&to=%d", symbol, from, to);
            HttpEntity<String> entity = new HttpEntity<>(getHeaders());
            ResponseEntity<FintablesChartResponse> response = restTemplate.exchange(url, HttpMethod.GET, entity, FintablesChartResponse.class);

            if (response.getBody() != null && "ok".equals(response.getBody().getS()) && response.getBody().getT() != null) {
                List<Long> times = response.getBody().getT();
                List<BigDecimal> prices = response.getBody().getC();

                for (int i = 0; i < times.size(); i++) {
                    HistoricalDataDto dto = new HistoricalDataDto();
                    dto.setTimestamp(times.get(i) * 1000); // Fintables epoch saniye döndürür; frontend milisaniye bekler.
                    dto.setDate(Instant.ofEpochMilli(dto.getTimestamp()).atZone(ZoneId.systemDefault()).toLocalDate());
                    BigDecimal price = prices.get(i);
                    dto.setClose(price); dto.setPrice(price); dto.setOpen(price); dto.setHigh(price); dto.setLow(price); dto.setVolume(0L);
                    historyList.add(dto);
                }
            }
        } catch (Exception e) {
            log.error("[TEFAS_FUND_CHART] Failed to fetch history for {}: {}", symbol, e.getMessage());
        }
        return historyList;
    }
}