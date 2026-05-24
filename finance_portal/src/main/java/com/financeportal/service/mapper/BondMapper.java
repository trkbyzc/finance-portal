package com.financeportal.service.mapper;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class BondMapper {

    // 🚀 ÇÖZÜM: RedisTemplate yerine StringRedisTemplate kullanıyoruz!
    // Bu sayede Python'dan gelen saf JSON string'ini hiç bozulmadan alıyoruz.
    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;

    public List<Map<String, Object>> getBondYieldCurve() {
        log.debug("📊 Tahvil gösterge listesi oluşturuluyor...");
        List<Map<String, Object>> yieldCurve = new ArrayList<>();


        Map<String, String[]> bondConfig = new LinkedHashMap<>();
        // 🚀 ÇÖZÜM: Yeni seçtiğimiz kodlar ve gerçek vade tarihleri
        bondConfig.put("evds:benchmark:1m",  new String[]{"Kısa Vadeli", "TP.TRD080726K10", "8 Tem 2026"});
        bondConfig.put("evds:benchmark:3m",  new String[]{"1+ Yıl",      "TP.TRD070727K10", "7 Tem 2027"});
        bondConfig.put("evds:benchmark:6m",  new String[]{"2+ Yıl",      "TP.TRT050728K21", "5 Tem 2028"});
        bondConfig.put("evds:benchmark:1y",  new String[]{"3+ Yıl",      "TP.TRT040729K21", "4 Tem 2029"});
        bondConfig.put("evds:benchmark:2y",  new String[]{"4+ Yıl",      "TP.TRT020130K18", "2 Oca 2030"});
        bondConfig.put("evds:benchmark:5y",  new String[]{"5 Yıl+",      "TP.TRT120331K39", "12 Mar 2031"});
        bondConfig.put("evds:benchmark:10y", new String[]{"10 Yıl+",     "TP.TRT070335K16", "7 Mar 2035"});

        bondConfig.forEach((redisKey, meta) -> {
            try {
                String jsonStr = stringRedisTemplate.opsForValue().get(redisKey);
                if (jsonStr != null && !jsonStr.trim().isEmpty()) {
                    List<Map<String, Object>> historyList = objectMapper.readValue(jsonStr, new TypeReference<>() {});
                    if (!historyList.isEmpty()) {
                        Map<String, Object> latestData = historyList.get(historyList.size() - 1);
                        double yieldValue = Double.parseDouble(latestData.get("rate").toString());

                        yieldCurve.add(Map.of(
                                "label", meta[0],
                                "symbol", meta[1],
                                "maturityDate", meta[2],
                                "yield", yieldValue,
                                "name", meta[0] + " DİBS"
                        ));
                    }
                }
            } catch (Exception e) {
                log.warn("⚠️ {} parse hatası: {}", meta[0], e.getMessage());
            }
        });
        return yieldCurve;
    }

    public List<Map<String, Object>> getFallbackYieldCurve() {
        log.warn("⚠️ Tahvil verisi boş, yeni fallback verileri kullanılıyor");
        List<Map<String, Object>> bonds = new ArrayList<>();

        // 🚀 DÜZELTME: Fallback verilerini senin seçtiğin yeni kodlarla güncelledik
        String[] displayNames = {"Kısa Vadeli", "1+ Yıl", "2+ Yıl", "3+ Yıl", "4+ Yıl", "5 Yıl+", "10 Yıl+"};
        String[] symbols = {"TP.TRD080726K10", "TP.TRD070727K10", "TP.TRT050728K21", "TP.TRT040729K21", "TP.TRT020130K18", "TP.TRT120331K39", "TP.TRT070335K16"};
        String[] dates = {"8 Tem 2026", "7 Tem 2027", "5 Tem 2028", "4 Tem 2029", "2 Oca 2030", "12 Mar 2031", "7 Mar 2035"};
        double[] baseYields = {15.72, 16.10, 16.50, 17.20, 17.80, 18.50, 19.10};

        for (int i = 0; i < displayNames.length; i++) {
            bonds.add(Map.of(
                    "label", displayNames[i],
                    "symbol", symbols[i],
                    "maturityDate", dates[i],
                    "yield", baseYields[i],
                    "name", displayNames[i] + " DİBS"
            ));
        }
        return bonds;
    }
}