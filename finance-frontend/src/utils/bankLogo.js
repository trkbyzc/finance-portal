/**
 * Türk banka / döviz bürosu adından logo (favicon) URL'i üretir.
 * Ad → domain eşlemesi normalize edilmiş (Türkçe karakter/aksan temizlenmiş) anahtar kelimeyle yapılır;
 * logo Google favicon servisinden gelir (hotlink-dostu, evrensel). Eşleşme yoksa null → çağıran taraf
 * jenerik banka ikonuna düşer.
 */

const normalize = (s = '') =>
    s.toLocaleLowerCase('tr')
        .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
        .replace(/ç/g, 'c').replace(/ö/g, 'o').replace(/ü/g, 'u')
        .normalize('NFD').replace(/[̀-ͯ]/g, '') // kombine aksanları (İ→i̇) temizle
        .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

// Sıra önemli: spesifik (uzun) anahtar kelimeler önce — "ziraat katilim" > "ziraat".
const BANK_DOMAINS = [
    ['ziraat katilim', 'ziraatkatilim.com.tr'],
    ['vakif katilim', 'vakifkatilim.com.tr'],
    ['emlak katilim', 'emlakkatilim.com.tr'],
    ['kuveyt turk', 'kuveytturk.com.tr'],
    ['turkiye finans', 'turkiyefinans.com.tr'],
    ['yapi kredi', 'yapikredi.com.tr'],
    ['is bankasi', 'isbank.com.tr'],
    ['garanti', 'garantibbva.com.tr'],
    ['akbank', 'akbank.com'],
    ['ziraat', 'ziraatbank.com.tr'],
    ['vakifbank', 'vakifbank.com.tr'],
    ['vakif', 'vakifbank.com.tr'],
    ['halkbank', 'halkbank.com.tr'],
    ['halk', 'halkbank.com.tr'],
    ['qnb', 'qnb.com.tr'],
    ['finansbank', 'qnb.com.tr'],
    ['denizbank', 'denizbank.com.tr'],
    ['fibabanka', 'fibabanka.com.tr'],
    ['fiba', 'fibabanka.com.tr'],
    ['enpara', 'enpara.com'],
    ['sekerbank', 'sekerbank.com.tr'],
    ['teb', 'teb.com.tr'],
    ['hsbc', 'hsbc.com.tr'],
    ['albaraka', 'albaraka.com.tr'],
    ['odeabank', 'odeabank.com.tr'],
    ['anadolubank', 'anadolubank.com.tr'],
    ['alternatif', 'alternatifbank.com.tr'],
    ['abank', 'alternatifbank.com.tr'],
    ['burgan', 'burgan.com.tr'],
    ['icbc', 'icbc.com.tr'],
    ['citi', 'citibank.com.tr'],
    ['ing', 'ing.com.tr'],
    // Döviz büroları / kıymetli maden
    ['harem', 'haremaltin.com'],
    ['altinkaynak', 'altinkaynak.com'],
    ['hakan', 'hakandoviz.com'],
    ['odaci', 'odacidoviz.com'],
];

/** Banka adı → domain (eşleşme yoksa null). */
export function bankDomain(name) {
    if (!name) return null;
    const n = normalize(name);
    if (!n) return null;
    for (const [kw, domain] of BANK_DOMAINS) {
        if (n.includes(kw)) return domain;
    }
    return null;
}

/** Banka adı → logo (favicon) URL'i; eşleşme yoksa null. */
export function bankLogo(name) {
    const domain = bankDomain(name);
    return domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : null;
}
