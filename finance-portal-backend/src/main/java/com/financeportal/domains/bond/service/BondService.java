package com.financeportal.domains.bond.service;

import com.financeportal.client.yahoo.YahooQuoteClient;
import com.financeportal.model.dto.market.MarketAssetDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class BondService {

    private final YahooQuoteClient yahooQuoteClient;

    public List<MarketAssetDto> getGlobalBonds() {
        log.info("[GLOBAL-BOND] Yahoo Finance üzerinden küresel tahvil verileri çekiliyor...");

        String[] globalBondSymbols = {
                "^IRX",    // ABD 13 Haftalık Hazine Bonosu
                "^FVX",    // ABD 5 Yıllık Hazine Tahvili
                "^TNX",    // ABD 10 Yıllık Hazine Tahvili
                "^TYX"     // ABD 30 Yıllık Hazine Tahvili
        };

        return yahooQuoteClient.fetchQuotes(globalBondSymbols, "BOND");
    }
}