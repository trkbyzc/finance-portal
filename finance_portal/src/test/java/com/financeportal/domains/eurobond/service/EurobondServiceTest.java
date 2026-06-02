package com.financeportal.domains.eurobond.service;

import com.financeportal.domains.eurobond.client.BusinessInsiderBondClient;
import com.financeportal.domains.eurobond.client.BusinessInsiderBondClient.BusinessInsiderBondDetail;
import com.financeportal.domains.eurobond.config.EurobondCatalog;
import com.financeportal.domains.eurobond.config.EurobondCatalog.CatalogEntry;
import com.financeportal.domains.eurobond.dto.EurobondDto;
import com.financeportal.service.cache.CacheService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.function.Supplier;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EurobondServiceTest {

    @Mock
    private EurobondCatalog catalog;
    @Mock
    private BusinessInsiderBondClient client;
    @Mock
    private CacheService cacheService;

    @InjectMocks
    private EurobondService service;

    /** CacheService.getOrFetch'i gerçek fetcher'ı çalıştıracak şekilde stub'la. */
    @SuppressWarnings("unchecked")
    private void runFetcherDirectly() {
        when(cacheService.getOrFetch(anyString(), any(Supplier.class), anyLong()))
                .thenAnswer(inv -> ((Supplier<List<EurobondDto>>) inv.getArgument(1)).get());
    }

    private BusinessInsiderBondDetail detail(String tk, String ccy, String coupon, String yield, String price, String maturity) {
        return BusinessInsiderBondDetail.builder()
                .tkData(tk).currency(ccy)
                .coupon(coupon == null ? null : new BigDecimal(coupon))
                .bondYield(yield == null ? null : new BigDecimal(yield))
                .price(price == null ? null : new BigDecimal(price))
                .changePercent(new BigDecimal("0.39"))
                .maturity(maturity)
                .build();
    }

    @Test
    void getEurobondList_mapsCatalogEntriesToDto() {
        runFetcherDirectly();
        when(catalog.getEntries()).thenReturn(List.of(
                new CatalogEntry("US900123DV94", "slug-1", "USD"),
                new CatalogEntry("US900123DS65", "slug-2", "USD")
        ));
        when(client.fetchDetail("slug-1"))
                .thenReturn(detail("1,111,1330,333", "USD", "6.3750", "6.55", "99.37", "2031-05-22"));
        when(client.fetchDetail("slug-2"))
                .thenReturn(detail("1,222,1330,333", "USD", "7.125", "7.20", "101.10", "2036-03-15"));

        List<EurobondDto> list = service.getEurobondList();

        assertEquals(2, list.size());
        EurobondDto b1 = list.get(0);
        assertEquals("US900123DV94", b1.getSymbol());
        assertEquals("US900123DV94", b1.getIsin());
        assertEquals("EUROBOND", b1.getAssetCategory());
        assertEquals("LINE", b1.getChartType());
        assertEquals("1,111,1330,333", b1.getTkData());
        assertEquals(new BigDecimal("99.37"), b1.getPrice());
        assertEquals(new BigDecimal("6.55"), b1.getBondYield());
        assertEquals("Türkiye %6.375 2031 (USD)", b1.getName());
    }

    @Test
    void getEurobondList_skipsBondsWithNullDetail() {
        runFetcherDirectly();
        when(catalog.getEntries()).thenReturn(List.of(
                new CatalogEntry("US900123DV94", "slug-1", "USD"),
                new CatalogEntry("US900123BAD", "bad-slug", "USD")
        ));
        when(client.fetchDetail("slug-1"))
                .thenReturn(detail("1,111,1330,333", "USD", "6.375", "6.55", "99.37", "2031-05-22"));
        when(client.fetchDetail("bad-slug")).thenReturn(null);

        List<EurobondDto> list = service.getEurobondList();

        assertEquals(1, list.size());
        assertEquals("US900123DV94", list.get(0).getIsin());
    }

    @Test
    void resolveTkData_findsByIsin_caseInsensitive() {
        runFetcherDirectly();
        when(catalog.getEntries()).thenReturn(List.of(new CatalogEntry("US900123DV94", "slug-1", "USD")));
        when(client.fetchDetail("slug-1"))
                .thenReturn(detail("1,111,1330,333", "USD", "6.375", "6.55", "99.37", "2031-05-22"));

        assertEquals("1,111,1330,333", service.resolveTkData("us900123dv94"));
        assertNull(service.resolveTkData("US000000XX00"));
        assertNull(service.resolveTkData(null));
    }

    @Test
    void getEurobondList_emptyCatalog_returnsEmpty() {
        runFetcherDirectly();
        when(catalog.getEntries()).thenReturn(List.of());
        assertTrue(service.getEurobondList().isEmpty());
    }
}
