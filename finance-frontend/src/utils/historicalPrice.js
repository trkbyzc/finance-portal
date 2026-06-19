import { historicalApi } from '../services/api';

/**
 * Portföy varlık tipinden /historical kategori adı.
 * (Tarih→fiyat çekiminde kullanılır; bilinmeyende null → çağıran manuel girişe düşer.)
 */
export function historicalCategory(assetType, symbol) {
    const s = (symbol || '').toUpperCase();
    switch (assetType) {
        case 'STOCK': return 'STOCK';
        case 'CRYPTO': return 'CRYPTO';
        case 'CURRENCY': return 'CURRENCY';
        case 'COMMODITY': return 'COMMODITY';
        case 'FUTURE': return 'VIOP';
        case 'BOND': return s.startsWith('TP.') ? 'TR_BOND' : 'BOND';
        case 'FUND': return 'TR_FUND';
        default: return assetType || null;
    }
}

const toIso = (p) => {
    if (Array.isArray(p.date)) {
        return `${p.date[0]}-${String(p.date[1]).padStart(2, '0')}-${String(p.date[2]).padStart(2, '0')}`;
    }
    if (p.date) return p.date;
    // VİOP gibi `date` alanı boş, yalnızca epoch `timestamp` dönen seriler için: timestamp'i
    // yerel takvim gününe çevir (kullanıcının seçtiği tarihle aynı zaman diliminde eşleşsin).
    const ts = p.timestamp ?? p.time;
    if (ts) {
        const ms = Number(ts) < 1e12 ? Number(ts) * 1000 : Number(ts);
        const d = new Date(ms);
        if (!Number.isNaN(d.getTime())) {
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
    }
    return null;
};

/**
 * Belirli bir tarihteki kapanış fiyatını döndürür (o tarih ya da öncesindeki en yakın gün).
 * Bulamazsa null (best-effort; ağ/kategori hatasında sessizce null).
 */
export async function fetchPriceOnDate(symbol, assetType, dateStr) {
    if (!symbol || !dateStr) return null;
    const category = historicalCategory(assetType, symbol);
    if (!category) return null;
    try {
        const start = new Date(dateStr);
        start.setDate(start.getDate() - 12); // tatil/hafta sonu boşlukları için pencere
        const startDate = start.toISOString().slice(0, 10);
        const res = await historicalApi.getCustomRange({ symbol, category, startDate, endDate: dateStr });
        const arr = Array.isArray(res) ? res : (res?.priceData || res || []);
        const pts = arr
            .map(p => ({ date: toIso(p), close: Number(p.close ?? p.price) }))
            .filter(p => p.date && !Number.isNaN(p.close))
            .sort((a, b) => (a.date < b.date ? -1 : 1));
        if (!pts.length) return null;
        // Sadece istenen tarih VEYA öncesindeki en yakın günü kabul et.
        // Döviz gibi bazı kategorilerde backend tarih aralığını yok sayıp güncel veriyi
        // dönebiliyor; bu durumda istenen tarihten sonraki noktalar gelir ve "şimdiki fiyat"
        // sızar. O yüzden tarihten önce nokta yoksa null döneriz (kullanıcı elle girer).
        const before = pts.filter(p => p.date <= dateStr);
        if (!before.length) return null;
        return before[before.length - 1].close ?? null;
    } catch {
        return null;
    }
}
