import i18n from '../../i18n';

const getLocale = () => (i18n.language?.startsWith('en') ? 'en-US' : 'tr-TR');

export const formatNumber = (value, minDecimals = 2, maxDecimals = 2) => {
    if (value == null || Number.isNaN(Number(value))) return '-';
    return new Intl.NumberFormat(getLocale(), {
        minimumFractionDigits: minDecimals,
        maximumFractionDigits: maxDecimals
    }).format(value);
};

export const formatPercent = (value) => {
    if (value == null || Number.isNaN(Number(value))) {
        return i18n.language?.startsWith('en') ? '0.00%' : '%0,00';
    }

    const locale = getLocale();
    const isEn = locale === 'en-US';

    const formatted = new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(Math.abs(value));

    const sign = value > 0 ? '+' : value < 0 ? '-' : '';

    // TR: %12,34   EN: 12.34%
    if (isEn) {
        return `${sign}${formatted}%`;
    }
    return `${sign}%${formatted}`;
};

/**
 * İşaretsiz yüzde: oran/ağırlık/getiri kotası gösterimi için (kâr-zarar değil).
 * formatPercent her zaman +/- ekler; portföy ağırlığı veya DİBS getirisi gibi
 * değerlerde işaret istenmez.
 *
 * TR: %36 · %10,28    EN: 36% · 10.28%
 */
export const formatPercentPlain = (value, digits = 2) => {
    if (value == null || Number.isNaN(Number(value))) return '-';
    const locale = getLocale();
    const formatted = new Intl.NumberFormat(locale, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
    }).format(value);
    return locale === 'en-US' ? `${formatted}%` : `%${formatted}`;
};

export const formatCompactNumber = (value) => {
    if (value == null || Number.isNaN(Number(value))) return '-';
    return new Intl.NumberFormat(getLocale(), {
        notation: 'compact',
        compactDisplay: 'short',
        maximumFractionDigits: 2
    }).format(value);
};
