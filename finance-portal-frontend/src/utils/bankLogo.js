/**
 * Türk banka / döviz bürosu adından logo (favicon) URL'i üretir.
 * Ad → domain eşlemesi normalize edilmiş (Türkçe karakter/aksan temizlenmiş) anahtar kelimeyle yapılır;
 * logo Google favicon servisinden gelir (hotlink-dostu, evrensel). Eşleşme yoksa null → çağıran taraf
 * jenerik banka ikonuna düşer.
 */

const normalize = (s = '') =>
    s.toLocaleLowerCase('tr')
        .replaceAll('ı', 'i').replaceAll('ş', 's').replaceAll('ğ', 'g')
        .replaceAll('ç', 'c').replaceAll('ö', 'o').replaceAll('ü', 'u')
        .normalize('NFD').replaceAll(/[̀-ͯ]/g, '') // kombine aksanları (İ→i̇) temizle
        .replaceAll(/[^a-z0-9 ]/g, ' ').replaceAll(/\s+/g, ' ').trim();

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
    // Portföy yönetim şirketleri (TEFAS fon kurucuları). Çoğu büyük bankaların yan
    // kuruluşları — banka domain'iyle eşleştiriyoruz; bağımsız portföy şirketleri için
    // kendi domain'leri. Sıra: bileşik isim önce ("ak portfoy" > "akbank").
    ['ak portfoy', 'akbank.com'],
    ['is portfoy', 'isbank.com.tr'],
    ['garanti portfoy', 'garantibbva.com.tr'],
    ['yapi kredi portfoy', 'yapikredi.com.tr'],
    ['teb portfoy', 'teb.com.tr'],
    ['ziraat portfoy', 'ziraatbank.com.tr'],
    ['halk portfoy', 'halkbank.com.tr'],
    ['vakif portfoy', 'vakifbank.com.tr'],
    ['qnb portfoy', 'qnb.com.tr'],
    ['hsbc portfoy', 'hsbc.com.tr'],
    ['fiba portfoy', 'fibabanka.com.tr'],
    ['ing portfoy', 'ing.com.tr'],
    ['denizbank portfoy', 'denizbank.com.tr'],
    ['icbc portfoy', 'icbc.com.tr'],
    ['burgan portfoy', 'burgan.com.tr'],
    // Bağımsız portföy / yatırım kuruluşları
    ['ata portfoy', 'ata.com.tr'],
    ['atlas portfoy', 'atlasmenkul.com.tr'],
    ['hedef portfoy', 'hedefyatirim.com.tr'],
    ['tacirler portfoy', 'tacirleryatirim.com.tr'],
    ['allianz', 'allianz.com.tr'],
    ['anadolu hayat', 'anadoluhayat.com.tr'],
    ['inveo portfoy', 'inveo.com.tr'],
    ['oyak portfoy', 'oyakyatirim.com.tr'],
    ['marbas portfoy', 'marbasmenkul.com.tr'],
    ['rota portfoy', 'rotaportfoy.com.tr'],
    ['azimut portfoy', 'azimut.com.tr'],
    ['actus portfoy', 'actusportfoy.com.tr'],
    ['gedik portfoy', 'gedik.com'],
    ['unlu portfoy', 'unluco.com'],
    ['re-pie portfoy', 'repie.com'],
    ['re pie portfoy', 'repie.com'],
    ['osmanli portfoy', 'osmanlimenkul.com.tr'],
    ['nn portfoy', 'nnhayatemeklilik.com.tr'],
    ['phillip capital', 'phillipcapital.com.tr'],
    ['vakif emeklilik', 'vakifemeklilik.com.tr'],
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
