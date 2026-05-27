import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { CalendarDays, Loader2, AlertCircle } from 'lucide-react';
import { economicCalendarApi } from '../../services/api/economicCalendarApi';
import { getFlagUrl } from '../../utils/currencyUtils.js';

// 4 hafta penceresi — backend zaten today-7 → today+21 cache'liyor
const todayIso = () => new Date().toISOString().slice(0, 10);
const isoOffset = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
};

const IMPACT_LEVELS = [
    { value: 'LOW', dotClass: 'bg-text-muted', labelKey: 'economicCalendar:impact.low' },
    { value: 'MEDIUM', dotClass: 'bg-warning', labelKey: 'economicCalendar:impact.medium' },
    { value: 'HIGH', dotClass: 'bg-sell', labelKey: 'economicCalendar:impact.high' }
];

const MAJOR_COUNTRIES = [
    'TR', 'US', 'EU', 'GB', 'JP', 'DE', 'FR', 'CN', 'CA', 'AU', 'CH'
];

const fmtTime = (iso) => {
    if (!iso) return '—';
    try {
        const d = new Date(iso);
        return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    } catch { return iso; }
};

const fmtDateHeader = (date) => {
    try {
        return new Date(date + 'T00:00:00').toLocaleDateString('tr-TR', {
            weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
        });
    } catch { return date; }
};

const fmtNum = (v, unit = '') => {
    if (v === null || v === undefined) return '—';
    const n = Number(v);
    if (Number.isNaN(n)) return '—';
    const formatted = Math.abs(n) >= 1000
        ? n.toLocaleString('tr-TR', { maximumFractionDigits: 2 })
        : n.toLocaleString('tr-TR', { maximumFractionDigits: 4 });
    return unit ? `${formatted}${unit === '%' ? '%' : ' ' + unit}` : formatted;
};

export default function EconomicCalendarPage() {
    const { t } = useTranslation(['economicCalendar', 'common']);
    const [fromDate, setFromDate] = useState(isoOffset(-1));
    const [toDate, setToDate] = useState(isoOffset(14));
    const [selectedCountries, setSelectedCountries] = useState(new Set()); // boş = hepsi
    const [minImpact, setMinImpact] = useState('LOW');

    const { data: events = [], isLoading, isError } = useQuery({
        queryKey: ['economic-calendar', fromDate, toDate, Array.from(selectedCountries).sort().join(','), minImpact],
        queryFn: () => economicCalendarApi.getEvents({
            from: fromDate,
            to: toDate,
            countries: selectedCountries.size > 0 ? Array.from(selectedCountries).join(',') : undefined,
            minImpact: minImpact !== 'LOW' ? minImpact : undefined
        }),
        staleTime: 5 * 60 * 1000 // 5 dakika
    });

    // Tarih başlığına göre grupla (sticky day headers için)
    const grouped = useMemo(() => {
        const m = new Map();
        for (const e of events) {
            if (!e.time) continue;
            const day = e.time.slice(0, 10);
            if (!m.has(day)) m.set(day, []);
            m.get(day).push(e);
        }
        return Array.from(m.entries()).sort(([a], [b]) => a.localeCompare(b));
    }, [events]);

    const toggleCountry = (code) => {
        setSelectedCountries(prev => {
            const next = new Set(prev);
            if (next.has(code)) next.delete(code);
            else next.add(code);
            return next;
        });
    };

    const clearCountries = () => setSelectedCountries(new Set());

    const impactDotClass = (impact) => {
        const cfg = IMPACT_LEVELS.find(l => l.value === impact);
        return cfg ? cfg.dotClass : 'bg-text-muted';
    };

    return (
        <div className="min-h-screen bg-bg text-text p-4 md:p-8">
            <div className="max-w-[1300px] mx-auto">
                {/* Header */}
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                        <CalendarDays size={20} />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold">{t('economicCalendar:pageTitle')}</h1>
                </div>
                <p className="text-text-muted mb-6">{t('economicCalendar:pageSubtitle')}</p>

                {/* Filter bar */}
                <div className="bg-surface border border-border rounded-2xl p-4 mb-6 space-y-4">
                    {/* Date range + impact */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-[10px] font-bold text-text-muted mb-1 uppercase tracking-wider">
                                {t('economicCalendar:filter.from')}
                            </label>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                max={todayIso()}
                                className="w-full bg-bg border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-text-muted mb-1 uppercase tracking-wider">
                                {t('economicCalendar:filter.to')}
                            </label>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="w-full bg-bg border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-text-muted mb-1 uppercase tracking-wider">
                                {t('economicCalendar:filter.minImpact')}
                            </label>
                            <div className="flex gap-1.5">
                                {IMPACT_LEVELS.map(l => (
                                    <button
                                        key={l.value}
                                        onClick={() => setMinImpact(l.value)}
                                        className={`flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-semibold rounded-lg border transition ${
                                            minImpact === l.value
                                                ? 'bg-primary/10 border-primary/40 text-primary'
                                                : 'bg-bg border-border text-text-muted hover:bg-surface-hover'
                                        }`}
                                    >
                                        <span className={`w-2 h-2 rounded-full ${l.dotClass}`}></span>
                                        {t(l.labelKey)}+
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Country chips */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                                {t('economicCalendar:filter.countries')} {selectedCountries.size > 0 && `(${selectedCountries.size})`}
                            </label>
                            {selectedCountries.size > 0 && (
                                <button
                                    onClick={clearCountries}
                                    className="text-[10px] text-primary hover:underline"
                                >
                                    {t('economicCalendar:filter.clearCountries')}
                                </button>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {MAJOR_COUNTRIES.map(code => {
                                const active = selectedCountries.has(code);
                                return (
                                    <button
                                        key={code}
                                        onClick={() => toggleCountry(code)}
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border transition ${
                                            active
                                                ? 'bg-primary/15 border-primary/40 text-primary'
                                                : 'bg-bg border-border text-text-muted hover:bg-surface-hover'
                                        }`}
                                    >
                                        <img src={getFlagUrl(code)} alt={code} className="w-3.5 h-3.5 rounded-full object-cover" />
                                        {code}
                                    </button>
                                );
                            })}
                        </div>
                        {selectedCountries.size === 0 && (
                            <p className="text-[10px] text-text-muted mt-1.5">{t('economicCalendar:filter.allCountriesHint')}</p>
                        )}
                    </div>
                </div>

                {/* Results */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20 text-text-muted">
                        <Loader2 className="animate-spin mr-3" size={24} />
                        <span>{t('common:status.loading')}</span>
                    </div>
                ) : isError ? (
                    <div className="bg-sell/10 border border-sell/30 rounded-xl p-6 text-sell flex items-center gap-3">
                        <AlertCircle size={20} />
                        <span>{t('economicCalendar:error')}</span>
                    </div>
                ) : grouped.length === 0 ? (
                    <div className="bg-surface border border-border rounded-2xl p-12 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mx-auto mb-4 flex items-center justify-center text-primary">
                            <CalendarDays size={28} />
                        </div>
                        <h2 className="text-xl font-bold mb-2">{t('economicCalendar:empty.title')}</h2>
                        <p className="text-text-muted max-w-md mx-auto">{t('economicCalendar:empty.subtitle')}</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {grouped.map(([day, dayEvents]) => (
                            <div key={day} className="bg-surface border border-border rounded-2xl overflow-hidden">
                                {/* Day header */}
                                <div className="sticky top-0 z-10 bg-surface-2/95 backdrop-blur-sm border-b border-border px-4 py-2 flex items-center justify-between">
                                    <span className="font-bold text-sm capitalize">{fmtDateHeader(day)}</span>
                                    <span className="text-[10px] text-text-muted">
                                        {dayEvents.length} {t('economicCalendar:eventsLabel')}
                                    </span>
                                </div>

                                {/* Event rows */}
                                <div className="divide-y divide-border">
                                    {dayEvents.map(e => (
                                        <div key={e.id} className="px-4 py-3 hover:bg-surface-hover transition flex items-center gap-3 text-sm">
                                            <div className="font-mono text-text-muted w-14 shrink-0">{fmtTime(e.time)}</div>
                                            <img src={getFlagUrl(e.country)} alt={e.country} className="w-6 h-6 rounded-full object-cover border border-border shrink-0" />
                                            <div className="w-10 shrink-0 text-[10px] font-bold text-text-muted uppercase">{e.country}</div>
                                            <span className={`w-2 h-2 rounded-full shrink-0 ${impactDotClass(e.impact)}`} title={e.impact}></span>
                                            <div className="flex-1 min-w-0 font-medium truncate">{e.event}</div>

                                            {/* Numbers — mobile collapses */}
                                            <div className="hidden md:flex items-center gap-4 text-right shrink-0">
                                                <div className="w-20">
                                                    <div className="text-[9px] text-text-muted uppercase tracking-wider">{t('economicCalendar:cols.previous')}</div>
                                                    <div className="font-mono text-xs">{fmtNum(e.previous, e.unit)}</div>
                                                </div>
                                                <div className="w-20">
                                                    <div className="text-[9px] text-text-muted uppercase tracking-wider">{t('economicCalendar:cols.estimate')}</div>
                                                    <div className="font-mono text-xs">{fmtNum(e.estimate, e.unit)}</div>
                                                </div>
                                                <div className="w-20">
                                                    <div className="text-[9px] text-text-muted uppercase tracking-wider">{t('economicCalendar:cols.actual')}</div>
                                                    <div className={`font-mono text-xs font-bold ${
                                                        e.actual !== null && e.estimate !== null
                                                            ? (Number(e.actual) > Number(e.estimate) ? 'text-buy' : Number(e.actual) < Number(e.estimate) ? 'text-sell' : 'text-text')
                                                            : 'text-text'
                                                    }`}>{fmtNum(e.actual, e.unit)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
