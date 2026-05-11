package com.financeportal.service;

import com.financeportal.model.dto.account.InterestYieldDto;
import com.financeportal.repository.AccountRepository;
import com.financeportal.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class InterestService {

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;

    // 🚀 ARTIK EVDSCLIENT YOK, IŞIK HIZINDA REDIS VAR!
    private final StringRedisTemplate redisTemplate;

    public List<InterestYieldDto> calculateDepositYields(BigDecimal amount, int days) {

        // 🚀 DİNAMİK VADE VE REDIS KEY SEÇİCİ
        String redisKey;
        BigDecimal withholdingTaxRate;

        if (days <= 32) {
            redisKey = "evds:deposit:32";
            withholdingTaxRate = new BigDecimal("0.075");
        } else if (days <= 92) {
            redisKey = "evds:deposit:92";
            withholdingTaxRate = new BigDecimal("0.075");
        } else if (days <= 181) {
            redisKey = "evds:deposit:181";
            withholdingTaxRate = new BigDecimal("0.075");
        } else if (days <= 365) {
            redisKey = "evds:deposit:365";
            withholdingTaxRate = new BigDecimal("0.05");
        } else {
            redisKey = "evds:deposit:365_plus";
            withholdingTaxRate = new BigDecimal("0.025");
        }

        double baseRate = 50.0; // Fallback varsayılan faiz oranı

        try {
            // 🚀 REDIS'TEN IŞIK HIZINDA OKUMA YAPIYORUZ
            String cachedRate = redisTemplate.opsForValue().get(redisKey);

            if (cachedRate != null && !cachedRate.trim().isEmpty()) {
                baseRate = Double.parseDouble(cachedRate);
                log.info("🎯 CACHE HIT! {} günlük vade için Redis'ten faiz çekildi: %{}", days, baseRate);
            } else {
                log.warn("⚠️ Redis'te veri yok. {} günlük vade için Fallback %{} kullanılıyor.", days, baseRate);
            }
        } catch (Exception e) {
            log.error("🔴 Redis okuma hatası: {}. Fallback %{} kullanılıyor.", e.getMessage(), baseRate);
        }

        // Banka Marjları (Spreads)
        Map<String, Double> bankSpreads = new HashMap<>();
        bankSpreads.put("Fibabanka", 4.0);
        bankSpreads.put("Akbank", 3.0);
        bankSpreads.put("ING Bank", 2.0);
        bankSpreads.put("Garanti BBVA", -1.0);
        bankSpreads.put("Enpara.com", -1.5);
        bankSpreads.put("QNB Finansbank", -2.0);
        bankSpreads.put("İş Bankası", -5.0);

        List<InterestYieldDto> results = new ArrayList<>();

        final double finalBaseRate = baseRate;
        bankSpreads.forEach((String bankName, Double spread) -> {
            BigDecimal finalRate = BigDecimal.valueOf(finalBaseRate + spread);

            // Brüt Getiri Formülü
            BigDecimal grossInterest = amount.multiply(finalRate).multiply(BigDecimal.valueOf(days))
                    .divide(BigDecimal.valueOf(36500), 2, RoundingMode.HALF_UP);

            // Dinamik Stopaj Kesintisi
            BigDecimal taxDeduction = grossInterest.multiply(withholdingTaxRate)
                    .setScale(2, RoundingMode.HALF_UP);

            BigDecimal netInterest = grossInterest.subtract(taxDeduction);
            BigDecimal totalPayment = amount.add(netInterest);

            results.add(new InterestYieldDto(bankName, finalRate.doubleValue(), netInterest, totalPayment));
        });

        // En çok kazandırandan en aza doğru sırala
        results.sort((a, b) -> Double.compare(b.getAnnualRate(), a.getAnnualRate()));
        return results;
    }

    // EOD Batch metodu (Burası sendedir, dokunmadım)
    @Scheduled(cron = "0 0 0 * * ?")
    @Transactional
    public void processDailyInterest() {
        log.info("Gün sonu (EOD) faiz işletim batch'i çalışıyor...");
        // Hesap güncellemeleri burada yapılır
    }
}