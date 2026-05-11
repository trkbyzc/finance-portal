import { ASSET_CDNS, FLAG_MAPPINGS } from '../constants/assets';

/**
 * Döviz koduna göre ülke bayrağı URL'sini döndürür.
 * Constants mimarisine bağlıdır, harita genişletilirse burası ellenmez.
 */
export const getFlagUrl = (currencyCode) => {
    if (!currencyCode) return '';

    const code = currencyCode.toUpperCase();

    // Önce merkezi haritaya (FLAG_MAPPINGS) bak, yoksa ilk 2 harfi al
    const countryCode = FLAG_MAPPINGS[code] || code.substring(0, 2).toLowerCase();

    return `${ASSET_CDNS.FLAGS}/${countryCode}.png`;
};