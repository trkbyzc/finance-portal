import i18n from '../../i18n';

const getLocale = () => (i18n.language?.startsWith('en') ? 'en-US' : 'tr-TR');

export const formatCurrency = (value, currencyCode = 'TRY', minDecimals = 2, maxDecimals = 4) => {
    if (value == null || isNaN(value)) return '-';

    return new Intl.NumberFormat(getLocale(), {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: minDecimals,
        maximumFractionDigits: maxDecimals
    }).format(value);
};
