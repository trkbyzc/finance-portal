/**
 * EconomicCalendarPage'in formatters + sabit listeleri.
 */

export const IMPACT_LEVELS = [
    { value: 'LOW', dotClass: 'bg-text-muted', labelKey: 'economicCalendar:impact.low' },
    { value: 'MEDIUM', dotClass: 'bg-warning', labelKey: 'economicCalendar:impact.medium' },
    { value: 'HIGH', dotClass: 'bg-sell', labelKey: 'economicCalendar:impact.high' }
];

export const MAJOR_COUNTRIES = ['TR', 'US', 'EU', 'GB', 'JP', 'DE', 'FR', 'CN', 'CA', 'AU', 'CH'];

export const todayIso = () => new Date().toISOString().slice(0, 10);

export const isoOffset = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
};

export const fmtTime = (iso) => {
    if (!iso) return '—';
    try {
        const d = new Date(iso);
        return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    } catch { return iso; }
};

export const fmtDateHeader = (date) => {
    try {
        return new Date(date + 'T00:00:00').toLocaleDateString('tr-TR', {
            weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
        });
    } catch { return date; }
};

export const fmtNum = (v, unit = '') => {
    if (v === null || v === undefined) return '—';
    const n = Number(v);
    if (Number.isNaN(n)) return '—';
    const formatted = Math.abs(n) >= 1000
        ? n.toLocaleString('tr-TR', { maximumFractionDigits: 2 })
        : n.toLocaleString('tr-TR', { maximumFractionDigits: 4 });
    return unit ? `${formatted}${unit === '%' ? '%' : ' ' + unit}` : formatted;
};

export const impactDotClass = (impact) => {
    const cfg = IMPACT_LEVELS.find(l => l.value === impact);
    return cfg ? cfg.dotClass : 'bg-text-muted';
};
