package com.financeportal.model.dto.simulation;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Bir simülasyonun tek-asset hesap sonucu. Hem `/api/simulation/preview` (stateless),
 * hem de SimulationDto.result alanı için kullanılır.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimulationResultDto {

    /** O tarihte alınabilecek varlık miktarı (amountTry / entryPrice). */
    private BigDecimal unitsBought;

    private BigDecimal entryPrice;

    /**
     * Hesabın gerçekten başladığı tarih. Kullanıcı'nın seçtiği investmentDate hafta sonu/tatil
     * ise historical'da o tarih yok; sistem >= filtreyle ilk uygun günü seçer ve buraya yazar.
     * UI "Hesap %s tarihinden başlatıldı" mesajı için kullanır.
     */
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate effectiveStartDate;

    /** Bugünkü birim fiyat (series'in son noktası). */
    private BigDecimal currentPrice;

    /** Bugünkü toplam değer (unitsBought × currentPrice). */
    private BigDecimal currentValue;

    /** Kar/Zarar TL cinsinden (currentValue - amountTry). */
    private BigDecimal pnlTry;

    private BigDecimal pnlPct;

    /** entry tarihinden bugüne yatırımın değer eğrisi (her gün için TRY karşılığı). */
    private List<PricePointDto> series;

    /** Hesap başarısız ise (yeterli historical yok, varlık bulunamadı vs.) doldurulan açıklama. */
    private String warning;
}
