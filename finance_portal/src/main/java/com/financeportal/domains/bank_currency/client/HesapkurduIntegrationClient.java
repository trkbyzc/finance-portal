package com.financeportal.domains.bank_currency.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.financeportal.domains.bank_currency.dto.BankCurrencyDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class HesapkurduIntegrationClient {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${external-api.hesapkurdu.url}")
    private String hesapkurduUrl = "https://apigw.hesapkurdu.com/v1/forex/fx/getExchangeRates";

    public List<BankCurrencyDto> fetchLiveBankRates() {
        long startTime = System.currentTimeMillis();
        List<BankCurrencyDto> bankRates = new ArrayList<>();

        try {
            HttpHeaders headers = new HttpHeaders();
            // Hesapkurdu API, standart Java User-Agent ile 403 döndürüyor; tarayıcı User-Agent zorunlu.
            headers.set("User-Agent", "Mozilla/5.0");
            headers.set("Accept", "application/json");
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(hesapkurduUrl, HttpMethod.GET, entity, String.class);

            if (response.getBody() != null) {
                JsonNode rootNode = objectMapper.readTree(response.getBody());
                JsonNode dataNode = rootNode.path("data").path("data");

                if (dataNode.isArray()) {
                    for (JsonNode node : dataNode) {
                        String exchangeType = node.path("exchange").asText("");

                        // Yalnızca banka ve döviz bürosu kayıtları alınır; diğer tipler (merkez bankası vb.) atlanır.
                        if ("Bank".equals(exchangeType) || "ExchOffice".equals(exchangeType)) {
                            String bankName = node.path("exchangeDisplayName").asText("Bilinmeyen");
                            String code = node.path("shortCode").asText("");
                            double buy = node.path("bid").asDouble(0.0);
                            double sell = node.path("ask").asDouble(0.0);

                            if (!code.isEmpty() && buy > 0 && sell > 0) {
                                BankCurrencyDto dto = new BankCurrencyDto();
                                dto.setBankName(bankName);
                                dto.setExchangeType(exchangeType);
                                dto.setCurrencyCode(code);
                                dto.setCurrencyName(bankName + " " + code);
                                dto.setForexBuying(BigDecimal.valueOf(buy));
                                dto.setForexSelling(BigDecimal.valueOf(sell));
                                dto.setAssetCategory("BANK_CURRENCY");
                                dto.setChartType("LINE");
                                bankRates.add(dto);
                            }
                        }
                    }
                }
                log.info("[HESAPKURDU] Fetched {} live bank/exchange rates in {} ms.", bankRates.size(), (System.currentTimeMillis() - startTime));
            }
        } catch (Exception e) {
            // Dış servis geçici olarak erişilemez olabilir; uygulama akışını kesmeden boş liste döndürülür.
            log.error("[HESAPKURDU] Failed to fetch bank rates: {}", e.getMessage());
        }
        return bankRates;
    }
}