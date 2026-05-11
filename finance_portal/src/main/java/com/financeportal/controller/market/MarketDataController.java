package com.financeportal.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.financeportal.model.dto.market.CurrencyRateDto;
import com.financeportal.model.dto.market.HistoricalDataDto;
import com.financeportal.model.dto.market.MarketAssetDto;
import com.financeportal.service.market.MarketDataService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/market-data")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Piyasa Verileri", description = "TCMB, EVDS, Kripto ve Global Varliklar")
public class MarketDataController {

    private final MarketDataService marketDataService;
    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;

    @GetMapping("/currencies")
    @Operation(summary = "TCMB Guncel Doviz Kurlarini Getir")
    public ResponseEntity<List<CurrencyRateDto>> getCurrencyRates() {
        return ResponseEntity.ok(marketDataService.getCurrencyRates());
    }

    @GetMapping("/bank-currencies")
    @Operation(summary = "Banka Bazli Simule Edilmis Doviz Kurlarini Getir")
    public ResponseEntity<List<CurrencyRateDto>> getSimulatedBankRates() {
        return ResponseEntity.ok(marketDataService.simulateBankRates());
    }

    @GetMapping("/crypto-currencies")
    @Operation(summary = "CoinGecko Uzerinden Kripto Para Kurlarini Getir")
    public ResponseEntity<List<CurrencyRateDto>> getCryptoRates() {
        return ResponseEntity.ok(marketDataService.getCryptoRates());
    }

    @GetMapping("/stocks")
    @Operation(summary = "Yahoo Finance Uzerinden Hisse Senedi Verilerini Getir")
    public ResponseEntity<List<MarketAssetDto>> getStocks() {
        return ResponseEntity.ok(marketDataService.getStocks());
    }

    @GetMapping("/bonds")
    @Operation(summary = "Global Tahvil Verilerini Getir (Yahoo)")
    public ResponseEntity<List<MarketAssetDto>> getBonds() {
        return ResponseEntity.ok(marketDataService.getBonds());
    }

    @GetMapping("/tr-bonds")
    @Operation(summary = "EVDS Uzerinden Gelen Guncel Turk Devlet Tahvilleri")
    public ResponseEntity<List<Map<String, Object>>> getTurkishBonds() {
        return ResponseEntity.ok(marketDataService.getTurkishBonds());
    }

    @GetMapping("/futures")
    @Operation(summary = "Global Vadeli Islem Verilerini Getir (Yahoo)")
    public ResponseEntity<List<MarketAssetDto>> getFutures() {
        return ResponseEntity.ok(marketDataService.getFutures());
    }

    @GetMapping("/viop")
    @Operation(summary = "İsYatirim Uzerinden Yerel VIOP Kontratlarini Getir")
    public ResponseEntity<List<MarketAssetDto>> getViopData() {
        return ResponseEntity.ok(marketDataService.getViopData());
    }

    @GetMapping("/funds")
    @Operation(summary = "Global Fon Verilerini Getir (ETF)")
    public ResponseEntity<List<MarketAssetDto>> getGlobalFunds() {
        return ResponseEntity.ok(marketDataService.getGlobalFunds());
    }

    @GetMapping("/tr-funds")
    @Operation(summary = "Turkiye Yatirim Fonlarini Getir (TEFAS/Fintables)")
    public ResponseEntity<List<MarketAssetDto>> getTrFunds() {
        return ResponseEntity.ok(marketDataService.getTrFunds());
    }

    @GetMapping("/commodities")
    @Operation(summary = "Emtia Fiyatlarini Getir")
    public ResponseEntity<List<MarketAssetDto>> getCommodities() {
        return ResponseEntity.ok(marketDataService.getCommodities());
    }

    // 🚀 YENİ EKLENDİ: Sadece Türk Altınlarını Getiren Endpoint
    @GetMapping("/turkish-gold")
    @Operation(summary = "Türkiye Kapalıçarşı Altın Fiyatlarını Getir")
    public ResponseEntity<List<MarketAssetDto>> getTurkishGold() {
        return ResponseEntity.ok(marketDataService.getTurkishGold());
    }

    @GetMapping("/indices")
    @Operation(summary = "BIST ve Global Endeksleri Getir")
    public ResponseEntity<List<MarketAssetDto>> getIndices() {
        return ResponseEntity.ok(marketDataService.getIndices());
    }

    @GetMapping("/economy")
    @Operation(summary = "Temel Ekonomik Gostergeleri Getir")
    public ResponseEntity<Map<String, Object>> getEconomyData() {
        return ResponseEntity.ok(marketDataService.getEconomyData());
    }

    @GetMapping("/economy/historical")
    @Operation(summary = "Ekonomik Metriklerin Gecmis Verilerini Getir")
    public ResponseEntity<List<Map<String, Object>>> getEconomyHistory(
            @RequestParam String metric,
            @RequestParam(defaultValue = "10y") String range) {
        return ResponseEntity.ok(marketDataService.getEconomyHistory(metric, range));
    }

    @GetMapping("/ipo")
    @Operation(summary = "Halka Arz Takvimini Getir")
    public ResponseEntity<List<Map<String, Object>>> getIPOCalendar() {
        return ResponseEntity.ok(marketDataService.getIPOCalendar());
    }

    @GetMapping("/all")
    @Operation(summary = "Tum Piyasa Verilerini Tek Seferde Getir")
    public ResponseEntity<Map<String, Object>> getAllMarketData() {
        // 🚀 JAVA'NIN 10 ELEMAN LİMİTİNE TAKILMAMAK İÇİN HASHMAP KULLANIYORUZ
        Map<String, Object> responseMap = new java.util.HashMap<>();

        responseMap.put("currencies", marketDataService.getCurrencyRates());
        responseMap.put("crypto", marketDataService.getCryptoRates());
        responseMap.put("stocks", marketDataService.getStocks());
        responseMap.put("indices", marketDataService.getIndices());
        responseMap.put("bonds", marketDataService.getBonds());
        responseMap.put("futures", marketDataService.getFutures());
        responseMap.put("viop", marketDataService.getViopData());
        responseMap.put("global_funds", marketDataService.getGlobalFunds());
        responseMap.put("tr_funds", marketDataService.getTrFunds());
        responseMap.put("commodities", marketDataService.getCommodities());
        responseMap.put("turkish_gold", marketDataService.getTurkishGold()); // 11. Eleman paşalar gibi eklendi!

        return ResponseEntity.ok(responseMap);
    }

    @GetMapping("/historical")
    @Operation(summary = "Varliklar Icin Detayli Tarihsel Fiyat Verilerini Getir")
    public ResponseEntity<?> getHistoricalData(
            @RequestParam String symbol,
            @RequestParam(defaultValue = "1mo") String range,
            @RequestParam(defaultValue = "1d") String interval,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "10") int maPeriod) {

        if (symbol != null && symbol.startsWith("TP.")) {
            try {
                String jsonStr = stringRedisTemplate.opsForValue().get("evds:history:" + symbol);

                if (jsonStr != null && !jsonStr.isBlank()) {
                    List<HistoricalDataDto> history = objectMapper.readValue(jsonStr, new TypeReference<>() {});
                    log.info("📊 EVDS Geçmiş Verisi Redis'ten Alındı: {}", symbol);
                    return ResponseEntity.ok(history);
                }
            } catch (Exception e) {
                log.error("⚠️ EVDS Geçmiş verisi parse edilemedi: {}", e.getMessage());
            }
        }

        return ResponseEntity.ok(marketDataService.getRealHistoricalData(symbol, range, interval, startDate, endDate, maPeriod));
    }
}