import { ASSET_CDNS } from '../constants/assets';

/**
 * Coin sembolündeki SONDAKİ fiat/stablecoin ekini (BTCUSDT -> BTC) temizler.
 *
 * Önemli: ek yalnızca sonda VE öncesinde bir taban sembol kalıyorsa silinir.
 * Aksi halde Tether (USDT), USDC, DAI gibi sembolün kendisi fiat ekiyle bitenler
 * tamamen silinip boş kalıyordu → ikon 404. Artık "USDT" -> "USDT" olarak korunur.
 */
export const cleanCoinSymbol = (symbol) => {
    if (!symbol) return '';
    const upper = symbol.toUpperCase();
    const stripped = upper.replace(/(USDT|TRY|USD)$/, '');
    return stripped.length > 0 ? stripped : upper;
};

/**
 * Coin sembolüne göre birincil CDN'den (atomiclabs) ikon URL'si döndürür.
 * CDN'de bulunmayan coinler için CryptoTable ikincil kaynağa (coincap) düşer.
 */
export const getCryptoIconUrl = (symbol) => {
    if (!symbol) return '';
    return `${ASSET_CDNS.CRYPTO_ICONS}/${cleanCoinSymbol(symbol).toLowerCase()}.png`;
};

/**
 * İkincil ikon kaynağı (coincap) — atomiclabs'te olmayan coinler için fallback.
 */
export const getCryptoIconFallbackUrl = (symbol) => {
    if (!symbol) return '';
    return `${ASSET_CDNS.CRYPTO_ICONS_FALLBACK}/${cleanCoinSymbol(symbol).toLowerCase()}@2x.png`;
};