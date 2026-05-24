package com.financeportal.controller.market;

import com.financeportal.domains.bond.service.BondService;
import com.financeportal.domains.turkish_bond.service.TurkishBondService;
import com.financeportal.domains.eurobond.service.EurobondService;
import com.financeportal.domains.fund.service.FundService;
import com.financeportal.domains.future.service.FutureService;
import com.financeportal.domains.stock.service.StockService;
import com.financeportal.domains.viop.service.ViopService;
import com.financeportal.domains.currency.service.CurrencyService; // 🚀 YENİ EKLENDİ
import com.financeportal.domains.crypto.service.CryptoService;     // 🚀 YENİ EKLENDİ
import com.financeportal.domains.commodity.service.CommodityService; // 🚀 YENİ EKLENDİ

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/market-data")
@RequiredArgsConstructor
@Tag(name = "Ana Pano (Dashboard)", description = "Tüm piyasa verilerini tek seferde toplayan aggregator")
public class MarketDataController {

    private final StockService stockService;
    private final BondService bondService;
    private final TurkishBondService turkishBondService;
    private final EurobondService eurobondService;
    private final FutureService futureService;
    private final ViopService viopService;
    private final FundService fundService;

    // 🚀 UNUTULAN/SİLİNEN SERVİSLER GERİ GELDİ
    private final CurrencyService currencyService;
    private final CryptoService cryptoService;
    private final CommodityService commodityService;

    @GetMapping("/all")
    @Operation(summary = "Tüm Piyasa Verilerini Tek Seferde Getir")
    public ResponseEntity<Map<String, Object>> getAllMarketData() {
        Map<String, Object> responseMap = new HashMap<>();

        // 🚀 Frontend bu 'currencies' kelimesini arıyor! Eklendi!
        responseMap.put("currencies", currencyService.getCurrencyRates());
        responseMap.put("cryptos", cryptoService.getCryptoRates());
        responseMap.put("commodities", commodityService.getCommodities());
        responseMap.put("turkish_gold", commodityService.getTurkishGold());

        // Mevcut olanlar
        responseMap.put("stocks", stockService.getStocks());
        responseMap.put("indices", stockService.getIndices());
        responseMap.put("global_bonds", bondService.getGlobalBonds());
        responseMap.put("tr_bonds", turkishBondService.getTurkishBonds());
        responseMap.put("futures", futureService.getFutures());
        responseMap.put("viop", viopService.getViopData());
        responseMap.put("global_funds", fundService.getGlobalFunds());
        responseMap.put("tr_funds", fundService.getTrFunds());
        responseMap.put("eurobonds", eurobondService.getEurobondList());

        return ResponseEntity.ok(responseMap);
    }
}