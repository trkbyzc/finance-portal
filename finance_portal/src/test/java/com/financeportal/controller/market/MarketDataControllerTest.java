package com.financeportal.controller.market;

import com.financeportal.domains.bond.service.BondService;
import com.financeportal.domains.commodity.service.CommodityService;
import com.financeportal.domains.crypto.service.CryptoService;
import com.financeportal.domains.currency.service.CurrencyService;
import com.financeportal.domains.eurobond.service.EurobondService;
import com.financeportal.domains.fund.service.FundService;
import com.financeportal.domains.future.service.FutureService;
import com.financeportal.domains.stock.service.StockService;
import com.financeportal.domains.turkish_bond.service.TurkishBondService;
import com.financeportal.domains.viop.service.ViopService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MarketDataControllerTest {

    @Mock private StockService stockService;
    @Mock private BondService bondService;
    @Mock private TurkishBondService turkishBondService;
    @Mock private EurobondService eurobondService;
    @Mock private FutureService futureService;
    @Mock private ViopService viopService;
    @Mock private FundService fundService;
    @Mock private CurrencyService currencyService;
    @Mock private CryptoService cryptoService;
    @Mock private CommodityService commodityService;

    @InjectMocks private MarketDataController controller;

    @Test
    void getAllMarketData_aggregatesAllSources() {
        when(currencyService.getCurrencyRates()).thenReturn(List.of());
        when(cryptoService.getCryptoRates()).thenReturn(List.of());
        when(commodityService.getCommodities()).thenReturn(List.of());
        when(commodityService.getTurkishGold()).thenReturn(List.of());
        when(stockService.getStocks()).thenReturn(List.of());
        when(stockService.getIndices()).thenReturn(List.of());
        when(bondService.getGlobalBonds()).thenReturn(List.of());
        when(turkishBondService.getTurkishBonds()).thenReturn(List.of());
        when(futureService.getFutures()).thenReturn(List.of());
        when(viopService.getViopData()).thenReturn(List.of());
        when(fundService.getGlobalFunds()).thenReturn(List.of());
        when(fundService.getTrFunds()).thenReturn(List.of());
        when(eurobondService.getEurobondList()).thenReturn(List.of());

        ResponseEntity<Map<String, Object>> resp = controller.getAllMarketData();

        assertEquals(HttpStatus.OK, resp.getStatusCode());
        Map<String, Object> body = resp.getBody();
        assertTrue(body.containsKey("currencies"));
        assertTrue(body.containsKey("cryptos"));
        assertTrue(body.containsKey("commodities"));
        assertTrue(body.containsKey("turkish_gold"));
        assertTrue(body.containsKey("stocks"));
        assertTrue(body.containsKey("indices"));
        assertTrue(body.containsKey("global_bonds"));
        assertTrue(body.containsKey("tr_bonds"));
        assertTrue(body.containsKey("futures"));
        assertTrue(body.containsKey("viop"));
        assertTrue(body.containsKey("global_funds"));
        assertTrue(body.containsKey("tr_funds"));
        assertTrue(body.containsKey("eurobonds"));
    }
}
