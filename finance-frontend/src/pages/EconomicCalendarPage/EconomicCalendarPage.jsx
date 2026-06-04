import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { CalendarDays, Loader2, AlertCircle } from 'lucide-react';
import { economicCalendarApi } from '../../services/api/economicCalendarApi';
import { isoOffset } from './calendarHelpers';
import CalendarFilters from './components/CalendarFilters';
import EventDayCard from './components/EventDayCard';

/**
 * Ekonomik takvim sayfası — orchestrator.
 *
 * Backend 4 hafta penceresi cache'liyor (today-7 → today+21). Filtre state'i + query burada;
 * UI filtreler (date/impact/country chips) ve event listesi (day cards) alt componentlerde.
 */
export default function EconomicCalendarPage() {
    const { t } = useTranslation(['economicCalendar', 'common']);
    const [fromDate, setFromDate] = useState(isoOffset(-1));
    const [toDate, setToDate] = useState(isoOffset(14));
    const [selectedCountries, setSelectedCountries] = useState(new Set());
    const [minImpact, setMinImpact] = useState('LOW');

    const { data: events = [], isLoading, isError } = useQuery({
        queryKey: ['economic-calendar', fromDate, toDate, Array.from(selectedCountries).sort().join(','), minImpact],
        queryFn: () => economicCalendarApi.getEvents({
            from: fromDate,
            to: toDate,
            countries: selectedCountries.size > 0 ? Array.from(selectedCountries).join(',') : undefined,
            minImpact: minImpact !== 'LOW' ? minImpact : undefined
        }),
        staleTime: 5 * 60 * 1000
    });

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

    return (
        <div className="min-h-screen bg-bg text-text p-4 md:p-8">
            <div className="max-w-[1300px] mx-auto">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                        <CalendarDays size={20} />
                    </div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">{t('economicCalendar:pageTitle')}</h1>
                </div>

                <CalendarFilters
                    fromDate={fromDate}
                    setFromDate={setFromDate}
                    toDate={toDate}
                    setToDate={setToDate}
                    minImpact={minImpact}
                    setMinImpact={setMinImpact}
                    selectedCountries={selectedCountries}
                    toggleCountry={toggleCountry}
                    clearCountries={clearCountries}
                />

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
                            <EventDayCard key={day} day={day} events={dayEvents} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
