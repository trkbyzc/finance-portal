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
import com.financeportal.exception.DataSourceUnavailableException;
import com.financeportal.model.dto.market.MarketDataResponseDto;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;

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

        ResponseEntity<MarketDataResponseDto> resp = controller.getAllMarketData();

        assertEquals(HttpStatus.OK, resp.getStatusCode());
        MarketDataResponseDto body = resp.getBody();
        assertNotNull(body);
        assertNotNull(body.getCurrencies());
        assertNotNull(body.getCryptos());
        assertNotNull(body.getCommodities());
        assertNotNull(body.getTurkishGold());
        assertNotNull(body.getStocks());
        assertNotNull(body.getIndices());
        assertNotNull(body.getGlobalBonds());
        assertNotNull(body.getTrBonds());
        assertNotNull(body.getFutures());
        assertNotNull(body.getViop());
        assertNotNull(body.getGlobalFunds());
        assertNotNull(body.getTrFunds());
        assertNotNull(body.getEurobonds());
    }

    /**
     * Kapalı kaynaklar artık istisna fırlatıyor (önceden önbellek katmanı yutuyordu).
     * Bu uç 13 kaynağı tek yanıtta birleştirdiği için, biri kapalı diye tamamının
     * çökmesi ana panoyu tamamen kullanılamaz hale getirirdi.
     */
    @Test
    void getAllMarketData_survivesDisabledSource() {
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
        // Canlıda gerçekten kapalı olan kaynak: eurobond → businessinsider.
        when(eurobondService.getEurobondList()).thenThrow(
                new DataSourceUnavailableException("businessinsider",
                        DataSourceUnavailableException.Reason.DISABLED, "canlı demoda kapalı"));

        ResponseEntity<MarketDataResponseDto> resp = controller.getAllMarketData();

        assertEquals(HttpStatus.OK, resp.getStatusCode());
        MarketDataResponseDto body = resp.getBody();
        assertNotNull(body);
        // Kapalı kaynak boş gelir...
        assertTrue(body.getEurobonds().isEmpty());
        // ...ama diğer 12 kategori etkilenmez.
        assertNotNull(body.getStocks());
        assertNotNull(body.getCurrencies());
        assertNotNull(body.getTrFunds());
    }
}
