/**
 * Sembol kodunu kullanıcıya GÖSTERİRKEN biçimler. Türk altını gibi alt tireli kodlarda
 * (GRAM_ALTIN, GRAM_HAS_ALTIN, CEYREK_ALTIN, YARIM_ALTIN…) alt tireyi boşlukla değiştirir.
 *
 * Sembolün gerçek değeri (API kimliği, navigasyon, eşleştirme) DEĞİŞMEZ — bu yalnız görsel etikettir.
 */
export const displaySymbol = (symbol) =>
    (symbol == null ? '' : String(symbol).replace(/_/g, ' '));
