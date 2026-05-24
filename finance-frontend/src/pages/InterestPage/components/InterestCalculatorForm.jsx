import React from 'react';
import { DollarSign, Calendar, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function InterestCalculatorForm({
                                                   amount, setAmount, days, setDays, loading, presetDays
                                               }) {
    const { t } = useTranslation(['interest', 'common']);
    return (
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-2xl sticky top-24 relative overflow-hidden">
            {loading && (
                <div className="absolute top-0 left-0 w-full h-1 bg-primary animate-pulse"></div>
            )}

            <h3 className="text-xl font-bold mb-6 border-b border-border pb-4 flex items-center gap-2">
                {t('interest:form.submit')}
            </h3>

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-semibold text-text-muted mb-2 flex items-center gap-2">
                        <DollarSign size={16}/> {t('interest:form.amount')} (TL)
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            className="w-full bg-surface-2 border border-border rounded-xl p-4 pl-12 text-xl font-bold text-text outline-none focus:border-primary transition-all"
                            min="1000"
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-bold">₺</span>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-text-muted mb-2 flex items-center gap-2">
                        <Calendar size={16}/> {t('interest:form.duration')}
                    </label>
                    <input
                        type="number"
                        value={days}
                        onChange={(e) => setDays(Number(e.target.value))}
                        className="w-full bg-surface-2 border border-border rounded-xl p-4 text-xl font-bold text-text outline-none focus:border-primary transition-all mb-3"
                        min="1"
                    />
                    <div className="flex flex-wrap gap-2">
                        {presetDays.map(d => (
                            <button
                                key={d}
                                type="button"
                                onClick={() => setDays(d)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${days === d ? 'bg-primary/20 border-primary text-primary' : 'bg-surface-2 border-border text-text-muted hover:text-text hover:border-border-strong'}`}
                            >
                                {d} {t('common:time.days')}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-surface-2 border border-border p-4 rounded-xl flex items-start gap-3 text-text-muted text-sm">
                    <Info className="shrink-0 text-primary mt-0.5" size={18} />
                    <p className="leading-relaxed">
                        {t('interest:info.withholding')}
                    </p>
                </div>
            </div>
        </div>
    );
}
