import { useTranslation } from 'react-i18next';

export default function ViopControls({ range, handleRangeChange, fromDate, toDate }) {
    const { t } = useTranslation('common');
    const ranges = [
        { tKey: '1w', v: '1w' },
        { tKey: '1m', v: '1mo' },
        { tKey: '1y', v: '1y' }
    ];

    return (
        <div className="px-6 py-4 flex items-center justify-between bg-surface border-b border-border flex-wrap gap-3">
            <div className="flex gap-2 bg-surface-2 p-1 rounded-lg border border-border">
                {ranges.map(btn => {
                    const active = range === btn.v;
                    return (
                        <button
                            key={btn.v}
                            onClick={() => handleRangeChange(btn.v)}
                            className={`w-9 h-9 rounded-md flex items-center justify-center font-bold text-xs transition-all ${
                                active
                                    ? 'bg-primary text-primary-fg shadow'
                                    : 'text-text-muted hover:text-text hover:bg-surface-hover'
                            }`}
                        >
                            {t(`ranges.${btn.tKey}`)}
                        </button>
                    );
                })}
            </div>

            {/* Vade aralığı sadece görsel — VIOP kontratının vade tarihleri statik. */}
            <div className="flex items-center gap-2 text-xs text-text font-mono bg-surface-2 border border-border rounded-lg px-3 py-2 opacity-80">
                <span>{fromDate}</span>
                <span className="text-text-muted">→</span>
                <span>{toDate}</span>
            </div>
        </div>
    );
}
