import { Calculator, ArrowDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function DashboardCalculator({ calcAmount, setCalcAmount, calcCurrency, setCalcCurrency, calculatedResult, usdRate }) {
    const { t } = useTranslation('dashboard');
    return (
        <div className="relative bg-surface border border-border rounded-2xl p-7 shadow-xl overflow-hidden">
            {usdRate === 0 && (
                <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm z-10 flex items-center justify-center text-xs text-text-muted animate-pulse">
                    {t('calculator.subtitle')}
                </div>
            )}

            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                    <Calculator className="text-primary" size={20}/>
                </div>
                <div>
                    <h3 className="text-base font-bold text-text">{t('calculator.title')}</h3>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider">{t('calculator.rate')}</p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="relative">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">
                        {t('calculator.amount')}
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            value={calcAmount}
                            onChange={(e) => setCalcAmount(e.target.value)}
                            placeholder="0"
                            className="w-full bg-surface-2 border border-border rounded-lg px-4 py-3.5 pr-16 text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all font-mono text-lg font-semibold"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted font-bold text-sm">
                            {calcCurrency}
                        </span>
                    </div>
                </div>

                <div className="flex gap-2">
                    {['USD', 'EUR'].map(c => {
                        const active = calcCurrency === c;
                        return (
                            <button
                                key={c}
                                onClick={() => setCalcCurrency(c)}
                                className={`flex-1 py-2.5 rounded-lg border text-xs font-bold transition-all ${
                                    active
                                        ? 'bg-primary/15 border-primary text-primary'
                                        : 'bg-surface-2 border-border text-text-muted hover:text-text hover:border-border-strong'
                                }`}
                            >
                                {c}
                            </button>
                        );
                    })}
                </div>

                <div className="flex flex-col items-center justify-center py-3">
                    <ArrowDown size={18} className="text-text-muted/50" />
                </div>

                <div className="bg-surface-2 border border-border rounded-xl p-5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">{t('calculator.to')}</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-text-muted text-2xl font-mono">₺</span>
                        <span className="text-3xl font-black text-text font-mono tracking-tight">
                            {calculatedResult}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
