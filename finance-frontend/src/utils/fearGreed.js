/**
 * Crypto Fear & Greed Index yardımcıları.
 * Renk skalası göstergenin doğasından gelir (kırmızı=korku → yeşil=açgözlülük); evrensel standart.
 */
export const FG_ZONES = [
    { min: 0, max: 25, label: 'Extreme Fear', tr: 'Aşırı Korku', color: '#ea3943' },
    { min: 25, max: 45, label: 'Fear', tr: 'Korku', color: '#f3841e' },
    { min: 45, max: 55, label: 'Neutral', tr: 'Nötr', color: '#f3d42f' },
    { min: 55, max: 75, label: 'Greed', tr: 'Açgözlülük', color: '#93d900' },
    { min: 75, max: 100, label: 'Extreme Greed', tr: 'Aşırı Açgözlülük', color: '#16c784' }
];

const zoneOf = (v) => FG_ZONES.find(z => v < z.max) || FG_ZONES[FG_ZONES.length - 1];

/** Değere göre renk. */
export const fgColor = (v) => zoneOf(Number(v)).color;

/** Değer/sınıflandırma → yerelleştirilmiş etiket (API'nin EN sınıfı varsa onu kullanır). */
export const fgLabel = (value, classification, lang = 'tr') => {
    const z = zoneOf(Number(value));
    if (lang === 'en') return classification || z.label;
    // TR: API EN sınıfını TR karşılığına çevir
    const byEn = FG_ZONES.find(zz => zz.label === classification);
    return (byEn ? byEn.tr : z.tr);
};
