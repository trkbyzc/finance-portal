package com.financeportal.service.portfolio;

import com.financeportal.domains.bond.service.BondService;
import com.financeportal.domains.commodity.dto.CommodityDto;
import com.financeportal.domains.commodity.service.CommodityService;
import com.financeportal.domains.crypto.dto.CryptoDto;
import com.financeportal.domains.crypto.service.CryptoService;
import com.financeportal.domains.currency.dto.CurrencyDto;
import com.financeportal.domains.currency.service.CurrencyService;
import com.financeportal.domains.fund.dto.FundDto;
import com.financeportal.domains.fund.service.FundService;
import com.financeportal.domains.future.service.FutureService;
import com.financeportal.domains.stock.dto.StockDto;
import com.financeportal.domains.stock.service.StockService;
import com.financeportal.domains.turkish_bond.service.TurkishBondService;
import com.financeportal.domains.viop.service.ViopService;
import com.financeportal.model.enums.AssetType;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@SuppressWarnings({"unchecked", "rawtypes"})
class PortfolioPriceServiceTest {

    @Mock private TurkishBondService turkishBondService;
    @Mock private BondService bondService;
    @Mock private FutureService futureService;
    @Mock private CryptoService cryptoService;
    @Mock private CurrencyService currencyService;
    @Mock private CommodityService commodityService;
    @Mock private ViopService viopService;
    @Mock private StockService stockService;
    @Mock private FundService fundService;

    @InjectMocks private PortfolioPriceService priceService;

    // -------- STOCK --------

    @Test
    void stock_extractsPriceFromStockList() {
        StockDto s = new StockDto();
        s.setSymbol("AKBNK.IS");
        s.setPrice(new BigDecimal("75.5"));
        when(stockService.getStocks()).thenReturn(List.of(s));

        assertEquals(new BigDecimal("75.5"),
                priceService.getCurrentPrice("AKBNK.IS", AssetType.STOCK));
    }

    @Test
    void stock_notFound_returnsZero() {
        StockDto s = new StockDto();
        s.setSymbol("AKBNK.IS");
        s.setPrice(new BigDecimal("75.5"));
        when(stockService.getStocks()).thenReturn(List.of(s));

        assertEquals(BigDecimal.ZERO,
                priceService.getCurrentPrice("GARAN.IS", AssetType.STOCK));
    }

    @Test
    void stock_nullPrice_returnsZero() {
        StockDto s = new StockDto();
        s.setSymbol("AKBNK.IS");
        s.setPrice(null);
        when(stockService.getStocks()).thenReturn(List.of(s));

        assertEquals(BigDecimal.ZERO,
                priceService.getCurrentPrice("AKBNK.IS", AssetType.STOCK));
    }

    @Test
    void stock_emptyList_returnsZero() {
        when(stockService.getStocks()).thenReturn(List.of());
        assertEquals(BigDecimal.ZERO,
                priceService.getCurrentPrice("X", AssetType.STOCK));
    }

    // -------- CRYPTO --------

    @Test
    void crypto_extractsFromCryptoDto() {
        CryptoDto btc = new CryptoDto();
        btc.setCurrencyCode("BTC");
        btc.setForexSelling(new BigDecimal("60000"));
        when(cryptoService.getCryptoRates()).thenReturn(List.of(btc));

        assertEquals(new BigDecimal("60000"),
                priceService.getCurrentPrice("BTC", AssetType.CRYPTO));
    }

    @Test
    void crypto_nullForexSelling_returnsZero() {
        CryptoDto btc = new CryptoDto();
        btc.setCurrencyCode("BTC");
        btc.setForexSelling(null);
        when(cryptoService.getCryptoRates()).thenReturn(List.of(btc));

        assertEquals(BigDecimal.ZERO,
                priceService.getCurrentPrice("BTC", AssetType.CRYPTO));
    }

    // -------- CURRENCY --------

    @Test
    void currency_extractsFromCurrencyDto() {
        CurrencyDto usd = new CurrencyDto();
        usd.setCurrencyCode("USD");
        usd.setForexSelling(new BigDecimal("34.50"));
        when(currencyService.getCurrencyRates()).thenReturn(List.of(usd));

        assertEquals(new BigDecimal("34.50"),
                priceService.getCurrentPrice("USD", AssetType.CURRENCY));
    }

    @Test
    void currency_linkedHashMapFormat_extracted() {
        // Cache-hit'te Redis'ten LinkedHashMap dönüyor
        LinkedHashMap<String, Object> usdMap = new LinkedHashMap<>();
        usdMap.put("currencyCode", "USD");
        usdMap.put("forexSelling", "34.50");
        List raw = List.of(usdMap);
        when(currencyService.getCurrencyRates()).thenReturn(raw);

        assertEquals(new BigDecimal("34.50"),
                priceService.getCurrentPrice("USD", AssetType.CURRENCY));
    }

    @Test
    void currency_linkedHashMapWithNumberFormat() {
        LinkedHashMap<String, Object> usdMap = new LinkedHashMap<>();
        usdMap.put("currencyCode", "USD");
        usdMap.put("forexSelling", 34.50);
        List raw = List.of(usdMap);
        when(currencyService.getCurrencyRates()).thenReturn(raw);

        assertEquals(0, new BigDecimal("34.50").compareTo(
                priceService.getCurrentPrice("USD", AssetType.CURRENCY)));
    }

    // -------- COMMODITY (fallback chain) --------

    @Test
    void commodity_foundInCommodities_returnsImmediately() {
        CommodityDto gold = new CommodityDto();
        gold.setSymbol("GC=F");
        gold.setPrice(new BigDecimal("2400"));
        when(commodityService.getCommodities()).thenReturn(List.of(gold));

        assertEquals(new BigDecimal("2400"),
                priceService.getCurrentPrice("GC=F", AssetType.COMMODITY));
    }

    @Test
    void commodity_notInCommodities_fallsBackToTurkishGold() {
        when(commodityService.getCommodities()).thenReturn(List.of());

        CommodityDto gram = new CommodityDto();
        gram.setSymbol("GRAM_ALTIN");
        gram.setPrice(new BigDecimal("2500"));
        when(commodityService.getTurkishGold()).thenReturn(List.of(gram));

        assertEquals(new BigDecimal("2500"),
                priceService.getCurrentPrice("GRAM_ALTIN", AssetType.COMMODITY));
    }

    // -------- BOND (TR → global fallback) --------

    @Test
    void bond_foundInTurkishBonds_returnsLinkedHashMapPrice() {
        LinkedHashMap<String, Object> trBond = new LinkedHashMap<>();
        trBond.put("symbol", "TP.X");
        trBond.put("price", "100.5");
        when(turkishBondService.getTurkishBonds()).thenReturn(List.of(trBond));

        assertEquals(new BigDecimal("100.5"),
                priceService.getCurrentPrice("TP.X", AssetType.BOND));
    }

    @Test
    void bond_notInTr_fallsBackToGlobalBonds() {
        when(turkishBondService.getTurkishBonds()).thenReturn(List.of());

        com.financeportal.model.dto.market.MarketAssetDto usBond =
                new com.financeportal.model.dto.market.MarketAssetDto();
        usBond.setSymbol("TLT");
        usBond.setPrice(new BigDecimal("95"));
        when(bondService.getGlobalBonds()).thenReturn(List.of(usBond));

        assertEquals(new BigDecimal("95"),
                priceService.getCurrentPrice("TLT", AssetType.BOND));
    }

    // -------- FUND (TR → global fallback) --------

    @Test
    void fund_foundInTrFunds_returnsImmediately() {
        FundDto fund = new FundDto();
        fund.setSymbol("AKB");
        fund.setPrice(new BigDecimal("12.5"));
        when(fundService.getTrFunds()).thenReturn(List.of(fund));

        assertEquals(new BigDecimal("12.5"),
                priceService.getCurrentPrice("AKB", AssetType.FUND));
    }

    @Test
    void fund_notInTr_fallsBackToGlobal() {
        when(fundService.getTrFunds()).thenReturn(List.of());

        FundDto spy = new FundDto();
        spy.setSymbol("SPY");
        spy.setPrice(new BigDecimal("550"));
        when(fundService.getGlobalFunds()).thenReturn(List.of(spy));

        assertEquals(new BigDecimal("550"),
                priceService.getCurrentPrice("SPY", AssetType.FUND));
    }

    // -------- FUTURE (VIOP → global fallback) --------

    @Test
    void future_foundInViop_returnsImmediately() {
        com.financeportal.domains.viop.dto.ViopDto viop = new com.financeportal.domains.viop.dto.ViopDto();
        viop.setSymbol("F_XU030");
        viop.setPrice(new BigDecimal("400"));
        when(viopService.getViopData()).thenReturn(List.of(viop));

        assertEquals(new BigDecimal("400"),
                priceService.getCurrentPrice("F_XU030", AssetType.FUTURE));
    }

    // -------- Error path --------

    @Test
    void serviceThrows_returnsZeroNotPropagated() {
        when(stockService.getStocks()).thenThrow(new RuntimeException("downstream down"));

        assertEquals(BigDecimal.ZERO,
                priceService.getCurrentPrice("AKBNK.IS", AssetType.STOCK));
    }
}
