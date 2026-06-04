import { useTranslation } from 'react-i18next';
import { getFlagUrl } from '../../../utils/currencyUtils.js';
import { IMPACT_LEVELS, MAJOR_COUNTRIES, todayIso } from '../calendarHelpers';
import DatePicker from '../../../components/common/DatePicker';

/**
 * Tarih aralığı + impact + ülke chip filtreleri. State parent'ta; bu component yalnız UI.
 */
export default function CalendarFilters({
    fromDate, setFromDate,
    toDate, setToDate,
    minImpact, setMinImpact,
    selectedCountries, toggleCountry, clearCountries
}) {
    const { t } = useTranslation('economicCalendar');

    return (
        <div className="bg-surface border border-border rounded-2xl p-4 mb-6 space-y-4">
            {/* Date range + impact */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                    <label className="block text-[10px] font-bold text-text-muted mb-1 uppercase tracking-wider">
                        {t('filter.from')}
                    </label>
                    <DatePicker
                        value={fromDate}
                        onChange={setFromDate}
                        max={todayIso()}
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-text-muted mb-1 uppercase tracking-wider">
                        {t('filter.to')}
                    </label>
                    <DatePicker
                        value={toDate}
                        onChange={setToDate}
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-text-muted mb-1 uppercase tracking-wider">
                        {t('filter.minImpact')}
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
                                <span className={`w-2 h-2 rounded-full ${l.dotClass}`} />
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
                        {t('filter.countries')} {selectedCountries.size > 0 && `(${selectedCountries.size})`}
                    </label>
                    {selectedCountries.size > 0 && (
                        <button onClick={clearCountries} className="text-[10px] text-primary hover:underline">
                            {t('filter.clearCountries')}
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
                    <p className="text-[10px] text-text-muted mt-1.5">{t('filter.allCountriesHint')}</p>
                )}
            </div>
        </div>
    );
}
