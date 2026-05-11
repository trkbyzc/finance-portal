export const formatNumber = (value, minDecimals = 2, maxDecimals = 2) => {
    if (value == null || isNaN(value)) return '-';
    return new Intl.NumberFormat('tr-TR', {
        minimumFractionDigits: minDecimals,
        maximumFractionDigits: maxDecimals
    }).format(value);
};

export const formatPercent = (value) => {
    if (value == null || isNaN(value)) return '%0,00';

    // Mutlak değerini alıp formatla (işareti biz kendimiz koyacağız)
    const formatted = new Intl.NumberFormat('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(Math.abs(value));

    // Değer pozitifse +, negatifse -, sıfırsa işaretsiz dön
    return value > 0 ? `+%${formatted}` : (value < 0 ? `-%${formatted}` : `%${formatted}`);
};