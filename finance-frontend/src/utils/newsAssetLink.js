/**
 * Bir haberi tıklanabilir bir varlık/kategori hedefine çevirir.
 *
 *  - Haber spesifik bir varlığa bağlıysa (relatedSymbol) → o varlığın grafiği.
 *  - Değilse, kategorisine göre ilgili piyasa sayfası.
 *  - Hiçbiri eşleşmezse null (chip gösterilmez).
 *
 * Backend NewsEntityTagger relatedSymbol/relatedName/relatedCategory doldurur;
 * category alanı TR ya da EN olabilir (aktif dile göre) — ikisini de eşleriz.
 */

// Haber kategorisi (TR + EN) → piyasa sayfası slug'ı.
const CATEGORY_ROUTE = {
    // TR
    'kripto': 'crypto',
    'borsa': 'tr-stocks',
    'döviz & forex': 'currencies',
    'emtialar': 'commodities',
    'tahvil & faiz': 'bonds',
    'yatırım fonları': 'tr-funds',
    'genel ekonomi': 'economy',
    // EN
    'crypto': 'crypto',
    'stocks': 'tr-stocks',
    'forex': 'currencies',
    'commodities': 'commodities',
    'bonds & rates': 'bonds',
    'funds': 'tr-funds',
    'economy': 'economy'
};

/**
 * @param {object} item - NewsDto (relatedSymbol/relatedName/relatedCategory/category)
 * @returns {{to: string, label: string, type: 'asset'|'category'} | null}
 */
export function newsAssetLink(item) {
    if (!item) return null;

    if (item.relatedSymbol) {
        // Altın → grafik route'u yerine özel gram altın sayfası.
        if (item.relatedCategory === 'GOLD') {
            return { to: '/markets/turkish-gold', label: item.relatedName || 'Gram Altın', type: 'asset' };
        }
        const cat = item.relatedCategory ? `?cat=${item.relatedCategory}` : '';
        return {
            to: `/chart/${encodeURIComponent(item.relatedSymbol)}${cat}`,
            label: item.relatedName || item.relatedSymbol,
            type: 'asset'
        };
    }

    const slug = item.category ? CATEGORY_ROUTE[item.category.trim().toLowerCase()] : null;
    if (slug) {
        return { to: `/markets/${slug}`, label: item.category, type: 'category' };
    }

    return null;
}
