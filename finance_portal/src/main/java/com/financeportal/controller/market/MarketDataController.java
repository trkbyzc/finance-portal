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
import com.financeportal.model.dto.market.MarketDataResponseDto;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/market-data")
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

    private final CurrencyService currencyService;
    private final CryptoService cryptoService;
    private final CommodityService commodityService;

    @GetMapping("/all")
    @Operation(summary = "Tüm Piyasa Verilerini Tek Seferde Getir")
    public ResponseEntity<MarketDataResponseDto> getAllMarketData() {
        return ResponseEntity.ok(MarketDataResponseDto.builder()
                .currencies(currencyService.getCurrencyRates())
                .cryptos(cryptoService.getCryptoRates())
                .commodities(commodityService.getCommodities())
                .turkishGold(commodityService.getTurkishGold())
                .stocks(stockService.getStocks())
                .indices(stockService.getIndices())
                .globalBonds(bondService.getGlobalBonds())
                .trBonds(turkishBondService.getTurkishBonds())
                .futures(futureService.getFutures())
                .viop(viopService.getViopData())
                .globalFunds(fundService.getGlobalFunds())
                .trFunds(fundService.getTrFunds())
                .eurobonds(eurobondService.getEurobondList())
                .build());
    }
}
