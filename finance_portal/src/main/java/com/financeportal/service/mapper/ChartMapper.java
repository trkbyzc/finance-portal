package com.financeportal.service.transformation;

import com.financeportal.model.dto.market.CurrencyRateDto;
import com.financeportal.model.dto.market.HistoricalDataDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

/**
 * Grafik verilerini transform eden service
 *
 * Görev:
 * - Moving average hesapla
 * - Döviz dönüştürmesi yap (USD → TRY gibi)
 * - Tarihsel veri temizliği/dönüştürmesi
 */
@Service
@Slf4j
public class ChartTransformationService {

    /**
     * Moving Average hesapla
     *
     * @param dataList Tarihsel veri listesi
     * @param maPeriod MA dönem (örn: 20 günü MA)
     * @return MA'nın hesaplanmış hali
     */
    public List<HistoricalDataDto> calculateMovingAverage(List<HistoricalDataDto> dataList, int maPeriod) {
        if (dataList == null || dataList.isEmpty()) {
            return dataList;
        }

        log.debug("📈 {} günlük Moving Average hesaplanıyor ({} veri noktası)", maPeriod, dataList.size());

        for (int i = 0; i < dataList.size(); i++) {
            if (i >= maPeriod - 1) {
                BigDecimal sum = BigDecimal.ZERO;

                // Son 'maPeriod' kadarının ortalamasını al
                for (int j = 0; j < maPeriod; j++) {
                    sum = sum.add(dataList.get(i - j).getClose());
                }

                BigDecimal ma = sum.divide(BigDecimal.valueOf(maPeriod), 4, RoundingMode.HALF_UP);
                dataList.get(i).setMovingAverage(ma);
            }
        }

        log.debug("✅ Moving Average hesaplandı");
        return dataList;
    }

    /**
     * Grafik verilerini döviz oranı ile çarp
     *
     * Kullanım: USD → TRY dönüştürmek için
     * Örn: USD/TRY = 32.50 ise, AAPL (USD cinsinden) fiyatını 32.50 ile çarp
     *
     * @param baseChart Base grafik (örn: USD cinsinden)
     * @param multiplier Döviz kuru (örn: USD/TRY = 32.50)
     * @return Dönüştürülmüş grafik
     */
    public List<HistoricalDataDto> convertCurrencyChart(List<HistoricalDataDto> baseChart, BigDecimal multiplier) {
        if (baseChart == null || baseChart.isEmpty() || multiplier.compareTo(BigDecimal.ZERO) <= 0) {
            return baseChart;
        }

        log.debug("💱 Grafik döviz dönüştürülüyor (multiplier: {})", multiplier);

        baseChart.forEach(dto -> {
            dto.setOpen(dto.getOpen().multiply(multiplier).setScale(4, RoundingMode.HALF_UP));
            dto.setHigh(dto.getHigh().multiply(multiplier).setScale(4, RoundingMode.HALF_UP));
            dto.setLow(dto.getLow().multiply(multiplier).setScale(4, RoundingMode.HALF_UP));
            dto.setClose(dto.getClose().multiply(multiplier).setScale(4, RoundingMode.HALF_UP));
            dto.setPrice(dto.getClose());
        });

        log.debug("✅ Döviz dönüştürme tamamlandı");
        return baseChart;
    }

    /**
     * 3 karakterli sembol (para kodu) için dönüştürme çarpanını hesapla
     *
     * @param symbol 3-karakterli kod (örn: "EUR", "GBP")
     * @param currencyRates Tüm döviz oranları
     * @return Dönüştürme çarpanı (örn: EUR/TRY = 35.20)
     */
    public BigDecimal calculateCurrencyMultiplier(String symbol, List<CurrencyRateDto> currencyRates) {
        BigDecimal symbolPrice = null;
        BigDecimal usdPrice = null;

        // Sembol ve USD fiyatlarını bul
        for (CurrencyRateDto rate : currencyRates) {
            if (rate.getCurrencyCode().equalsIgnoreCase(symbol)) {
                symbolPrice = rate.getForexSelling();
            }
            if (rate.getCurrencyCode().equalsIgnoreCase("USD")) {
                usdPrice = rate.getForexSelling();
            }
        }

        // Eğer EUR/TRY'yi istiyorsak: EUR/TRY = (EUR/USD * USD/TRY)
        if (symbolPrice != null && usdPrice != null && usdPrice.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal multiplier = symbolPrice.divide(usdPrice, 6, RoundingMode.HALF_UP);
            log.debug("💱 {} multiplier'ı: {}", symbol, multiplier);
            return multiplier;
        }

        log.warn("⚠️ {} döviz oranı bulunamadı", symbol);
        return BigDecimal.ONE;
    }

    /**
     * Grafiği 3-karakterli kod (EUR, GBP gibi) için dönüştür
     *
     * @param baseChart Base grafik (USD cinsinden)
     * @param symbol Hedef para kodu
     * @param currencyRates Tüm döviz oranları
     * @return Dönüştürülmüş grafik
     */
    public List<HistoricalDataDto> transformChartForCurrency(List<HistoricalDataDto> baseChart, String symbol, List<CurrencyRateDto> currencyRates) {
        BigDecimal multiplier = calculateCurrencyMultiplier(symbol, currencyRates);
        return convertCurrencyChart(baseChart, multiplier);
    }
}

