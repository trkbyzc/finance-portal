export const formatCurrency = (value, currencyCode = 'TRY', minDecimals = 2, maxDecimals = 4) => {
    if (value == null || isNaN(value)) return '-';

    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: minDecimals,
        maximumFractionDigits: maxDecimals
    }).format(value);
};