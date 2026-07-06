package com.financeportal.model.dto.market;

import com.financeportal.domains.commodity.dto.CommodityDto;
import com.financeportal.domains.crypto.dto.CryptoDto;
import com.financeportal.domains.currency.dto.CurrencyDto;
import com.financeportal.domains.eurobond.dto.EurobondDto;
import com.financeportal.domains.fund.dto.FundDto;
import com.financeportal.domains.future.dto.FutureDto;
import com.financeportal.domains.stock.dto.StockDto;
import com.financeportal.domains.viop.dto.ViopDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MarketDataResponseDto {
    private List<CurrencyDto> currencies;
    private List<CryptoDto> cryptos;
    private List<CommodityDto> commodities;
    private List<CommodityDto> turkishGold;
    private List<StockDto> stocks;
    private List<StockDto> indices;
    private List<MarketAssetDto> globalBonds;
    private List<Map<String, Object>> trBonds;
    private List<FutureDto> futures;
    private List<ViopDto> viop;
    private List<FundDto> globalFunds;
    private List<FundDto> trFunds;
    private List<EurobondDto> eurobonds;
}
