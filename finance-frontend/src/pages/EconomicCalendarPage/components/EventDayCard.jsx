import { useTranslation } from 'react-i18next';
import { getFlagUrl } from '../../../utils/currencyUtils.js';
import { fmtDateHeader, fmtTime, fmtNum, impactDotClass } from '../calendarHelpers';

/**
 * Tek bir gün için sticky header + o günün event satırları.
 * Satır mobile'da prev/estimate/actual kolonlarını gizler (md+ görünür).
 */
export default function EventDayCard({ day, events }) {
    const { t } = useTranslation('economicCalendar');

    return (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
            <div className="sticky top-0 z-10 bg-surface-2/95 backdrop-blur-sm border-b border-border px-4 py-2 flex items-center justify-between">
                <span className="font-bold text-sm capitalize">{fmtDateHeader(day)}</span>
                <span className="text-[10px] text-text-muted">
                    {events.length} {t('eventsLabel')}
                </span>
            </div>

            <div className="divide-y divide-border">
                {events.map(e => (
                    <EventRow key={e.id} event={e} />
                ))}
            </div>
        </div>
    );
}

function EventRow({ event: e }) {
    const { t } = useTranslation('economicCalendar');
    const actualColor = (e.actual !== null && e.estimate !== null)
        ? (Number(e.actual) > Number(e.estimate) ? 'text-buy' : Number(e.actual) < Number(e.estimate) ? 'text-sell' : 'text-text')
        : 'text-text';

    return (
        <div className="px-4 py-3 hover:bg-surface-hover transition flex items-center gap-3 text-sm">
            <div className="font-mono text-text-muted w-14 shrink-0">{fmtTime(e.time)}</div>
            <img src={getFlagUrl(e.country)} alt={e.country} className="w-6 h-6 rounded-full object-cover border border-border shrink-0" />
            <div className="w-10 shrink-0 text-[10px] font-bold text-text-muted uppercase">{e.country}</div>
            <span className={`w-2 h-2 rounded-full shrink-0 ${impactDotClass(e.impact)}`} title={e.impact} />
            <div className="flex-1 min-w-0 font-medium truncate">{e.event}</div>

            <div className="hidden md:flex items-center gap-4 text-right shrink-0">
                <div className="w-20">
                    <div className="text-[9px] text-text-muted uppercase tracking-wider">{t('cols.previous')}</div>
                    <div className="font-mono text-xs">{fmtNum(e.previous, e.unit)}</div>
                </div>
                <div className="w-20">
                    <div className="text-[9px] text-text-muted uppercase tracking-wider">{t('cols.estimate')}</div>
                    <div className="font-mono text-xs">{fmtNum(e.estimate, e.unit)}</div>
                </div>
                <div className="w-20">
                    <div className="text-[9px] text-text-muted uppercase tracking-wider">{t('cols.actual')}</div>
                    <div className={`font-mono text-xs font-bold ${actualColor}`}>{fmtNum(e.actual, e.unit)}</div>
                </div>
            </div>
        </div>
    );
}
