/**
 * Para birimi koduna (USD, EUR...) göre ülke bayrağı URL'i (flagcdn — hotlink-dostu).
 * Yalnız bilinen fiat kodları eşleşir; kripto/diğer semboller null döner.
 */
const CURRENCY_COUNTRY = {
    USD: 'us', EUR: 'eu', GBP: 'gb', JPY: 'jp', CHF: 'ch', CAD: 'ca', AUD: 'au',
    CNY: 'cn', RUB: 'ru', SAR: 'sa', AED: 'ae', SEK: 'se', NOK: 'no', DKK: 'dk',
    TRY: 'tr', KWD: 'kw', QAR: 'qa', BHD: 'bh', JOD: 'jo', INR: 'in', KRW: 'kr',
    HKD: 'hk', SGD: 'sg', NZD: 'nz', ZAR: 'za', BRL: 'br', MXN: 'mx', PLN: 'pl',
    CZK: 'cz', HUF: 'hu', RON: 'ro', BGN: 'bg', ILS: 'il', THB: 'th', IDR: 'id',
    MYR: 'my', PHP: 'ph', EGP: 'eg', AZN: 'az', GEL: 'ge', UAH: 'ua', IRR: 'ir'
};

/** Para birimi kodu → bayrak URL'i; bilinmiyorsa null. */
export function currencyFlag(code) {
    if (!code) return null;
    const cc = CURRENCY_COUNTRY[code.trim().toUpperCase()];
    return cc ? `https://flagcdn.com/w40/${cc}.png` : null;
}
