import { ASSET_CDNS, FIAT_PAIRS_REGEX } from '../constants/assets';

/**
 * Coin sembolüne göre güvenilir bir CDN'den ikon URL'si döndürür.
 * Constants mimarisine bağlıdır, CDN değişirse otomatik güncellenir.
 */
export const getCryptoIconUrl = (symbol) => {
    if (!symbol) return '';

    // Sembolü temizle (Örn: BTCUSDT -> BTC)
    const cleanSymbol = symbol.replace(FIAT_PAIRS_REGEX, '').toUpperCase();

    // Merkezi CDN linkini kullan
    return `${ASSET_CDNS.CRYPTO_ICONS}/${cleanSymbol.toLowerCase()}.png`;
};