import i18n from '../i18n';

const TR_MONTH_TO_EN = {
    'Oca': 'Jan', 'Şub': 'Feb', 'Mar': 'Mar', 'Nis': 'Apr',
    'May': 'May', 'Haz': 'Jun', 'Tem': 'Jul', 'Ağu': 'Aug',
    'Eyl': 'Sep', 'Eki': 'Oct', 'Kas': 'Nov', 'Ara': 'Dec'
};

const isEn = () => i18n.language?.startsWith('en');

/**
 * "Kısa Vadeli", "1+ Yıl", "10 Yıl+" gibi TR vade etiketlerini İngilizceye çevirir.
 */
export const translateBondLabel = (label) => {
    if (!label || !isEn()) return label;

    let result = label;
    result = result.replaceAll(/Kısa Vadeli/gi, 'Short Term');
    result = result.replaceAll(/Orta Vadeli/gi, 'Medium Term');
    result = result.replaceAll(/Uzun Vadeli/gi, 'Long Term');
    result = result.replaceAll(/Yıl\+?/g, 'Yr+').replaceAll('Yr+ Yr+', 'Yr+'); // 5 Yıl+ → 5 Yr+
    result = result.replaceAll('Yıl', 'Yr');
    result = result.replaceAll('Ay', 'Mo');
    return result;
};

/**
 * "Kısa Vadeli DİBS", "1+ Yıl DİBS" gibi tahvil isimlerini İngilizceye çevirir.
 */
export const translateBondName = (name) => {
    if (!name || !isEn()) return name;
    let result = translateBondLabel(name);
    result = result.replaceAll(/DİBS/gi, 'TR Gov. Bond');
    result = result.replaceAll(/Tahvil/gi, 'Bond');
    return result;
};

/**
 * "8 Tem 2026" gibi TR formatlı tarihleri "8 Jul 2026" formatına çevirir.
 */
export const translateBondDate = (dateStr) => {
    if (!dateStr || !isEn()) return dateStr;
    let result = dateStr;
    Object.entries(TR_MONTH_TO_EN).forEach(([tr, en]) => {
        result = result.replaceAll(new RegExp(`\\b${tr}\\b`, 'g'), en);
    });
    return result;
};
