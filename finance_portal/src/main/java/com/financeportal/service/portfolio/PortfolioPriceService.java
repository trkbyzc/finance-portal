package com.financeportal.service.portfolio;

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
    private final FutureService futureService;
    private final CryptoService cryptoService;
    private final CurrencyService currencyService;
    private final CommodityService commodityService;
    private final ViopService viopService;
    private final StockService stockService;
    private final FundService fundService;

    public BigDecimal getCurrentPrice(String symbol, AssetType assetType) {
        try {
            switch (assetType) {
                case STOCK:
                    return extractPriceFromList(stockService.getStocks(), symbol);
                case CRYPTO:
                    return extractCryptoCurrencyPrice(cryptoService.getCryptoRates(), symbol);
                case CURRENCY:
                    return extractCryptoCurrencyPrice(currencyService.getCurrencyRates(), symbol);
                case COMMODITY:
                    BigDecimal commodityPrice = extractPriceFromList(commodityService.getCommodities(), symbol);
                    if (commodityPrice.compareTo(BigDecimal.ZERO) > 0) return commodityPrice;
                    return extractPriceFromList(commodityService.getTurkishGold(), symbol);
                case BOND:
                    return extractPriceFromList(turkishBondService.getTurkishBonds(), symbol);
                case FUND:
                    BigDecimal trFundPrice = extractPriceFromList(fundService.getTrFunds(), symbol);
                    if (trFundPrice.compareTo(BigDecimal.ZERO) > 0) return trFundPrice;
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

    private BigDecimal extractCryptoCurrencyPrice(List<?> list, String symbol) {
        if (list == null) return BigDecimal.ZERO;
        for (Object obj : list) {
            if (obj instanceof LinkedHashMap map && symbol.equals(map.get("currencyCode"))) {
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
            if (obj instanceof LinkedHashMap map && symbol.equals(map.get("symbol"))) {
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