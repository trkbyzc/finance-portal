package com.financeportal.domains.commodity.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.financeportal.domains.commodity.dto.CommodityDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class TruncgilIntegrationClient {

    private final RestTemplate restTemplate;

    public List<CommodityDto> fetchLiveTurkishGold() {
        long startTime = System.currentTimeMillis();
        List<CommodityDto> goldList = new ArrayList<>();
        try {
            String url = "https://finans.truncgil.com/v3/today.json";
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
            headers.set("Accept", "application/json");
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
            String rawBody = response.getBody();

            if (rawBody != null && rawBody.trim().startsWith("{")) {
                ObjectMapper mapper = new ObjectMapper();
                Map<String, Object> data = mapper.readValue(rawBody, new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {});

                String[] targetGolds = {"gram-altin", "gram-has-altin", "ceyrek-altin", "yarim-altin", "tam-altin", "cumhuriyet-altini", "ata-altin", "14-ayar-altin", "18-ayar-altin", "22-ayar-bilezik", "ikibucuk-altin", "besli-altin", "gremse-altin", "resat-altin", "hamit-altin"};
                String[] targetNames = {"Gram Altın", "Has Altın", "Çeyrek Altın", "Yarım Altın", "Tam Altın", "Cumhuriyet Altını", "Ata Altın", "14 Ayar Altın", "18 Ayar Altın", "22 Ayar Bilezik", "2.5 (İkibuçuk) Altın", "Beşli Altın", "Gremse Altın", "Reşat Altın", "Hamit Altın"};

                for (int i = 0; i < targetGolds.length; i++) {
                    @SuppressWarnings("unchecked")
                    Map<String, String> goldData = (Map<String, String>) data.get(targetGolds[i]);

                    if (goldData != null) {
                        CommodityDto dto = new CommodityDto();
                        // Burada symbol 'GRAM_ALTIN', 'CEYREK_ALTIN' falan oluyor
                        dto.setSymbol(targetGolds[i].toUpperCase().replace("-", "_"));
                        dto.setName(targetNames[i]);
                        dto.setAssetType("TÜRK ALTINI");
                        dto.setAssetCategory("COMMODITY"); // Emtia!
                        dto.setChartType("CANDLE"); // Mum Grafik!

                        // 🚀 İŞTE BÜYÜ BURADA: Trunçgil'den gelen Altın'ın da Yahoo grafiği XAUTRY=X'tir!
                        // Artık GC=F diyerek Ons Altın'ın kimliğini çalmıyoruz.
                        dto.setYahooSymbol("XAUTRY=X");

                        String sellStr = goldData.get("Selling");
                        if (sellStr != null) {
                            sellStr = sellStr.replaceAll("[^0-9,-]", "").replace(",", ".");
                            dto.setPrice(new BigDecimal(sellStr));
                        }

                        String buyStr = goldData.get("Buying");
                        if (buyStr != null) {
                            buyStr = buyStr.replaceAll("[^0-9,-]", "").replace(",", ".");
                            dto.setBuyPrice(new BigDecimal(buyStr));
                        }

                        String changeStr = goldData.get("Change");
                        if (changeStr != null) {
                            changeStr = changeStr.replace("%", "").replace(",", ".").trim();
                            dto.setChangePercent(new BigDecimal(changeStr));
                        }

                        dto.setVolume(0L);
                        if (dto.getPrice() != null && dto.getPrice().compareTo(BigDecimal.ZERO) > 0) {
                            goldList.add(dto);
                        }
                    }
                }
                log.info("[TRUNCGIL] Fetched {} Turkish gold variants in {} ms.", goldList.size(), (System.currentTimeMillis() - startTime));
            } else {
                log.warn("[TRUNCGIL] Cloudflare block or HTML received. Mathematical fallback will trigger.");
            }
        } catch (Exception e) {
            log.warn("[TRUNCGIL] Failed to fetch live Turkish gold data: {}. Mathematical fallback will trigger.", e.getMessage());
        }
        return goldList;
    }
}