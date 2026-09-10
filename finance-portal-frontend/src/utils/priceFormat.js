/**
 * Düşük fiyatlı coinler (SHIB/PEPE gibi) için dinamik fiyat hassasiyeti.
 *
 * Klinecharts'ın y-ekseni/tooltip için ondalık basamak sayısını verir.
 * 1$ altındaki coinlerde 0'dan sonraki sıfırları sayar ve birkaç anlamlı
 * basamak ekler (0'dan sonra 15 basamağa kadar). Böylece 0.00000000123 gibi
 * fiyatlar 0.00000000 olarak yuvarlanıp kaybolmaz.
 */
export const computePricePrecision = (maxPrice) => {
    if (!Number.isFinite(maxPrice) || maxPrice <= 0) return 2;
    if (maxPrice >= 100) return 2;
    if (maxPrice >= 1) return 4;
    // 0 < maxPrice < 1: ondalıktan sonraki öncü sıfır sayısı + 5 anlamlı basamak.
    const leadingZeros = -Math.floor(Math.log10(maxPrice)) - 1;
    return Math.min(15, leadingZeros + 5);
};

/**
 * Tek bir fiyatın gösterimi için ondalık basamak sayısı (etiketler/kartlar).
 * 1$ altındaki değerlerde tutarın büyüklüğüne göre artar; aksi halde 2.
 */
export const computePriceLabelDigits = (value) => {
    const n = Math.abs(Number(value));
    if (!Number.isFinite(n) || n === 0 || n >= 1) return 2;
    const leadingZeros = -Math.floor(Math.log10(n)) - 1;
    return Math.min(15, leadingZeros + 4);
};
