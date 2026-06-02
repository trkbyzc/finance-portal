import i18n from '../../i18n';

const getLocale = () => (i18n.language?.startsWith('en') ? 'en-US' : 'tr-TR');

const parseDate = (dateInput) => {
    if (!dateInput) return null;
    let dateStr = dateInput;
    if (Array.isArray(dateInput)) {
        dateStr = `${dateInput[0]}-${String(dateInput[1]).padStart(2, '0')}-${String(dateInput[2]).padStart(2, '0')}`;
        if (dateInput.length > 3) {
            dateStr += `T${String(dateInput[3] || 0).padStart(2, '0')}:${String(dateInput[4] || 0).padStart(2, '0')}`;
        }
    }
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
};

export const formatDate = (dateInput) => {
    const date = parseDate(dateInput);
    if (!date) return '-';
    return new Intl.DateTimeFormat(getLocale(), {
        day: '2-digit', month: '2-digit', year: 'numeric'
    }).format(date);
};

export const formatDateTime = (dateInput) => {
    const date = parseDate(dateInput);
    if (!date) return '-';
    return new Intl.DateTimeFormat(getLocale(), {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    }).format(date);
};

/**
 * Grafik (recharts) eksen/tooltip tarihleri için — Türk usulü GG.AA.YYYY.
 * Girdi 'YYYY-MM-DD', 'YYYY-MM-DD HH:mm', dizi veya timestamp olabilir.
 * Saat bilgisi varsa GG.AA.YYYY SS:dd döner.
 */
export const formatChartDate = (value) => {
    if (value === null || value === undefined || value === '') return '';
    const date = parseDate(value);
    if (!date) return String(value);
    const hasTime = typeof value === 'string' && value.includes(':');
    return new Intl.DateTimeFormat(getLocale(), {
        day: '2-digit', month: '2-digit', year: 'numeric',
        ...(hasTime ? { hour: '2-digit', minute: '2-digit' } : {})
    }).format(date);
};

/**
 * klinecharts customApi.formatDate için — timestamp + klinecharts format şablonuna göre
 * Türk usulü tarih. Şablon granülaritesini korur (sadece saat / sadece tarih / tam).
 */
export const formatKlineDate = (timestamp, format = '') => {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return '';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    const f = String(format);
    const hasYear = f.includes('YYYY');
    const hasTime = f.includes('HH');
    if (hasYear && hasTime) return `${dd}.${mm}.${yyyy} ${hh}:${mi}`;
    if (hasTime && !hasYear) return `${hh}:${mi}`;
    if (hasYear) return `${dd}.${mm}.${yyyy}`;
    return `${dd}.${mm}`; // 'MM-DD' benzeri kısa eksen etiketi
};

export const formatDateLong = (dateInput) => {
    const date = parseDate(dateInput);
    if (!date) return '-';
    return new Intl.DateTimeFormat(getLocale(), {
        day: 'numeric', month: 'long', year: 'numeric'
    }).format(date);
};

export const formatTimeAgo = (dateInput) => {
    const date = parseDate(dateInput);
    if (!date) return '-';
    const diff = (Date.now() - date.getTime()) / 1000;
    const locale = getLocale();
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    if (diff < 60) return rtf.format(-Math.floor(diff), 'second');
    if (diff < 3600) return rtf.format(-Math.floor(diff / 60), 'minute');
    if (diff < 86400) return rtf.format(-Math.floor(diff / 3600), 'hour');
    if (diff < 86400 * 30) return rtf.format(-Math.floor(diff / 86400), 'day');
    if (diff < 86400 * 365) return rtf.format(-Math.floor(diff / (86400 * 30)), 'month');
    return rtf.format(-Math.floor(diff / (86400 * 365)), 'year');
};
