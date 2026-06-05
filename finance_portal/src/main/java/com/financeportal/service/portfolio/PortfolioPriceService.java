package com.financeportal.service.portfolio;

import com.financeportal.domains.bond.service.BondService;
import com.financeportal.domains.commodity.dto.CommodityDto;
import com.financeportal.domains.commodity.service.CommodityService;
import com.financeportal.domains.crypto.dto.CryptoDto;
import com.financeportal.domains.crypto.service.CryptoService;
import com.financeportal.domains.currency.dto.CurrencyDto;
import com.financeportal.domains.currency.service.CurrencyService;
import com.financeportal.domains.fund.client.TefasFundClient;
import com.financeportal.domains.fund.dto.FundDto;
import com.financeportal.domains.fund.service.FundService;
import com.financeportal.model.dto.market.HistoricalDataDto;
import com.financeportal.domains.future.service.FutureService;
import com.financeportal.domains.stock.dto.StockDto;
import com.financeportal.domains.stock.service.StockService;
import com.financeportal.domains.turkish_bond.service.TurkishBondService;
import com.financeportal.domains.viop.dto.ViopDto;
import com.financeportal.domains.viop.service.ViopService;
import com.financeportal.model.dto.market.MarketAssetDto;
import com.financeportal.model.enums.AssetType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class PortfolioPriceService {

    private final TurkishBondService turkishBondService;
    private final BondService bondService;
    private final FutureService futureService;
    private final CryptoService cryptoService;
    private final CurrencyService currencyService;
    private final CommodityService commodityService;
    private final ViopService viopService;
    private final StockService stockService;
    private final FundService fundService;
    private final TefasFundClient tefasFundClient;

    public BigDecimal getCurrentPrice(String symbol, AssetType assetType) {
        if (symbol == null || symbol.isBlank()) return BigDecimal.ZERO;
        try {
            switch (assetType) {
                case STOCK:
                    return extractPriceFromList(stockService.getStocks(), symbol);
                case CRYPTO:
                    // Portföye eklerken bazen Yahoo sembolü (BTC-USD, XRP-USD) kaydedilmiş.
                    // CryptoService bare format ile saklar (BTC, XRP) → -USD suffix'ini at.
                    String cryptoBase = symbol.toUpperCase().endsWith("-USD")
                            ? symbol.substring(0, symbol.length() - 4)
                            : symbol;
                    return extractCryptoCurrencyPrice(cryptoService.getCryptoRates(), cryptoBase);
                case CURRENCY:
                    return extractCryptoCurrencyPrice(currencyService.getCurrencyRates(), symbol);
                case COMMODITY:
                    BigDecimal commodityPrice = extractPriceFromList(commodityService.getCommodities(), symbol);
                    if (commodityPrice.compareTo(BigDecimal.ZERO) > 0) return commodityPrice;
                    return extractPriceFromList(commodityService.getTurkishGold(), symbol);
                case BOND:
                    BigDecimal trBondPrice = extractPriceFromList(turkishBondService.getTurkishBonds(), symbol);
                    if (trBondPrice.compareTo(BigDecimal.ZERO) > 0) return trBondPrice;
                    return extractPriceFromList(bondService.getGlobalBonds(), symbol);
                case FUND:
                    BigDecimal trFundPrice = extractPriceFromList(fundService.getTrFunds(), symbol);
                    if (trFundPrice.compareTo(BigDecimal.ZERO) > 0) return trFundPrice;
                    // TR fonların aggregate listede price=0 gelir (Fintables yield endpoint'i NAV vermez).
                    // Fallback: historical /barbar/udf/history (range=1y) → son geçerli NAV.
                    // Frontend usePortfolioPricing.js aynı pattern'i yapıyor; backend tarafında
                    // da yapmazsak Watchlist + Simulation ₺0.00 gösterir.
                    BigDecimal trFundLatestNav = fetchLatestTrFundNav(symbol);
                    if (trFundLatestNav.compareTo(BigDecimal.ZERO) > 0) return trFundLatestNav;
                    return extractPriceFromList(fundService.getGlobalFunds(), symbol);
                case FUTURE:
                    BigDecimal viopPrice = extractPriceFromList(viopService.getViopData(), symbol);
                    if (viopPrice.compareTo(BigDecimal.ZERO) > 0) return viopPrice;
                    return extractPriceFromList(futureService.getFutures(), symbol);
                default:
                    log.warn("Bilinmeyen varlık türü için fiyat talebi: {}", assetType);
                    return BigDecimal.ZERO;
            }
        } catch (Exception e) {
            log.error("❌ Fiyat çekilirken hata: {} - {}", symbol, e.getMessage());
            return BigDecimal.ZERO;
        }
    }

    /**
     * TR fon son geçerli NAV'ı historical endpoint'inden çek.
     * Dar pencerede ([]) dönen fonlar için range=1y zorunlu (memory/fund-price-gotcha).
     * Hata varsa 0 döner; çağıran kod kendi fallback'iyle devam eder.
     */
    private BigDecimal fetchLatestTrFundNav(String symbol) {
        try {
            List<HistoricalDataDto> series = tefasFundClient.fetchFundHistory(symbol.trim(), "1y");
            if (series == null || series.isEmpty()) return BigDecimal.ZERO;
            for (int i = series.size() - 1; i >= 0; i--) {
                BigDecimal nav = series.get(i).getPrice();
                if (nav != null && nav.compareTo(BigDecimal.ZERO) > 0) return nav;
            }
            return BigDecimal.ZERO;
        } catch (Exception e) {
            log.warn("[FUND-NAV] TR fon NAV çekilemedi: {} - {}", symbol, e.getMessage());
            return BigDecimal.ZERO;
        }
    }

    private BigDecimal extractCryptoCurrencyPrice(List<?> list, String symbol) {
        if (list == null) return BigDecimal.ZERO;
        for (Object obj : list) {
            if (obj instanceof LinkedHashMap<?, ?> map && symbol.equals(map.get("currencyCode"))) {
                return convertToBigDecimal(map.get("forexSelling"));
            } else if (obj instanceof CryptoDto crypto && symbol.equals(crypto.getCurrencyCode())) {
                return crypto.getForexSelling() != null ? crypto.getForexSelling() : BigDecimal.ZERO;
            } else if (obj instanceof CurrencyDto curr && symbol.equals(curr.getCurrencyCode())) {
                return curr.getForexSelling() != null ? curr.getForexSelling() : BigDecimal.ZERO;
            }
        }
        return BigDecimal.ZERO;
    }

    private BigDecimal extractPriceFromList(List<?> list, String symbol) {
        if (list == null || list.isEmpty()) return BigDecimal.ZERO;
        for (Object obj : list) {
            if (obj instanceof LinkedHashMap<?, ?> map && symbol.equals(map.get("symbol"))) {
                return convertToBigDecimal(map.get("price"));
            } else if (obj instanceof MarketAssetDto asset && symbol.equals(asset.getSymbol())) {
                return asset.getPrice() != null ? asset.getPrice() : BigDecimal.ZERO;
            } else if (obj instanceof CommodityDto commodity && symbol.equals(commodity.getSymbol())) {
                return commodity.getPrice() != null ? commodity.getPrice() : BigDecimal.ZERO;
            } else if (obj instanceof ViopDto viop && symbol.equals(viop.getSymbol())) {
                return viop.getPrice() != null ? viop.getPrice() : BigDecimal.ZERO;
            } else if (obj instanceof StockDto stock && symbol.equals(stock.getSymbol())) {
                return stock.getPrice() != null ? stock.getPrice() : BigDecimal.ZERO;
            } else if (obj instanceof FundDto fund && symbol.equals(fund.getSymbol())) {
                return fund.getPrice() != null ? fund.getPrice() : BigDecimal.ZERO;
            }
        }
        return BigDecimal.ZERO;
    }

    private BigDecimal convertToBigDecimal(Object obj) {
        if (obj == null) return BigDecimal.ZERO;
        if (obj instanceof BigDecimal bd) return bd;
        if (obj instanceof Number n) return new BigDecimal(n.toString());
        if (obj instanceof String s) {
            try { return new BigDecimal(s); } catch (NumberFormatException ignored) { return BigDecimal.ZERO; }
        }
        return BigDecimal.ZERO;
    }
}