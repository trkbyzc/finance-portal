package com.financeportal.controller.market;

import com.financeportal.domains.bond.service.BondService;
import com.financeportal.domains.turkish_bond.service.TurkishBondService;
import com.financeportal.domains.eurobond.service.EurobondService;
import com.financeportal.domains.fund.service.FundService;
import com.financeportal.domains.future.service.FutureService;
import com.financeportal.domains.stock.service.StockService;
import com.financeportal.domains.viop.service.ViopService;
import com.financeportal.domains.currency.service.CurrencyService;
import com.financeportal.domains.crypto.service.CryptoService;
import com.financeportal.domains.commodity.service.CommodityService;
import com.financeportal.exception.DataSourceUnavailableException;
import com.financeportal.model.dto.market.MarketDataResponseDto;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.function.Supplier;

@RestController
@RequestMapping("/market-data")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Ana Pano (Dashboard)", description = "Tüm piyasa verilerini tek seferde toplayan aggregator")
public class MarketDataController {

    private final StockService stockService;
    private final BondService bondService;
    private final TurkishBondService turkishBondService;
    private final EurobondService eurobondService;
    private final FutureService futureService;
    private final ViopService viopService;
    private final FundService fundService;

    private final CurrencyService currencyService;
    private final CryptoService cryptoService;
    private final CommodityService commodityService;

    @GetMapping("/all")
    @Operation(summary = "Tüm Piyasa Verilerini Tek Seferde Getir")
    public ResponseEntity<MarketDataResponseDto> getAllMarketData() {
        return ResponseEntity.ok(MarketDataResponseDto.builder()
                .currencies(optional(currencyService::getCurrencyRates))
                .cryptos(optional(cryptoService::getCryptoRates))
                .commodities(optional(commodityService::getCommodities))
                .turkishGold(optional(commodityService::getTurkishGold))
                .stocks(optional(stockService::getStocks))
                .indices(optional(stockService::getIndices))
                .globalBonds(optional(bondService::getGlobalBonds))
                .trBonds(optional(turkishBondService::getTurkishBonds))
                .futures(optional(futureService::getFutures))
                .viop(optional(viopService::getViopData))
                .globalFunds(optional(fundService::getGlobalFunds))
                .trFunds(optional(fundService::getTrFunds))
                .eurobonds(optional(eurobondService::getEurobondList))
                .build());
    }

    /**
     * Bu uç 13 kaynağı tek yanıtta birleştirir; biri kapalı diye tamamı çökmemeli.
     *
     * <p>Kapalı kaynaklar artık {@link DataSourceUnavailableException} fırlatıyor
     * (önceden önbellek katmanı bunu yutup boş liste dönüyordu). Ayrı uçlarda bu
     * istisna 503 + bilgi kartına dönüşmeli — istenen davranış budur. Ama <b>burada</b>
     * geçmesine izin verilirse ana pano komple 500 döner ve kapalı olmayan 12 kategori
     * de görünmez olur.
     *
     * <p>Bu yüzden toplayıcı, kaynak bazında tolere eder: kapalı olan boş liste olarak
     * gelir, diğerleri normal görünür. Ziyaretçi gerekçe metnini ilgili sekmenin kendi
     * ucunda görür.
     */
    private <T> List<T> optional(Supplier<List<T>> source) {
        try {
            return source.get();
        } catch (DataSourceUnavailableException e) {
            log.debug("[MARKET-ALL] '{}' kaynağı bu ortamda kapalı, panoda boş geçiliyor.", e.getSource());
            return List.of();
        }
    }
}
