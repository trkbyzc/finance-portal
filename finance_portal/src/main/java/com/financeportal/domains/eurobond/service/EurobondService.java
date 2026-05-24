package com.financeportal.domains.eurobond.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.financeportal.client.yahoo.YahooQuoteClient;
import com.financeportal.domains.eurobond.dto.EurobondAggregateDto;
import com.financeportal.model.dto.market.MarketAssetDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

/**
 * Eurobond verilerini sağlar.
 *
 * - getEurobondList(): Yahoo'dan EMB (iShares J.P. Morgan USD EM Bond ETF) fiyatı çekilir.
 *   Türkiye'nin USD cinsi Eurobond getirisinin en pratik açık-kaynak proxy'si — Türkiye EMB ETF'in
 *   yaklaşık %8-10'unu oluşturur. Doğrudan TR Eurobond yield serisi açık kaynaklarda yok.
 *
 * - getAggregateOverview(): EurobondSyncService tarafından Redis'e yazılan EVDS aggregate
 *   ("Türkiye Dış Borçlanma Görünümü") verisi okunur.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EurobondService {

    private static final String AGGREGATE_KEY = "eurobond:aggregate:overview";
    private static final String[] EUROBOND_PROXY_SYMBOLS = { "EMB" };

    private final YahooQuoteClient yahooQuoteClient;
    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;

    public List<MarketAssetDto> getEurobondList() {
        log.info("[EUROBOND] Yahoo'dan EMB ETF (USD EM Bond proxy) çekiliyor.");
        List<MarketAssetDto> list = yahooQuoteClient.fetchQuotes(EUROBOND_PROXY_SYMBOLS, "EUROBOND");

        // Yahoo'dan dönen DTO'lara EUROBOND-spesifik metadata ekle
        for (MarketAssetDto dto : list) {
            dto.setAssetCategory("EUROBOND");
            dto.setChartType("LINE");
            if (dto.getName() == null || dto.getName().isBlank()) {
                dto.setName("iShares J.P. Morgan USD EM Bond ETF");
            }
        }
        return list;
    }

    public EurobondAggregateDto getAggregateOverview() {
        try {
            String jsonStr = stringRedisTemplate.opsForValue().get(AGGREGATE_KEY);
            if (jsonStr != null && !jsonStr.isEmpty()) {
                return objectMapper.readValue(jsonStr, EurobondAggregateDto.class);
            }
        } catch (Exception e) {
            log.error("[EUROBOND] Aggregate okuma hatası: {}", e.getMessage());
        }
        return new EurobondAggregateDto(
                Collections.emptyList(),
                Collections.emptyList(),
                Collections.emptyList(),
                LocalDate.now().toString()
        );
    }
}
