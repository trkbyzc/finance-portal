import { useTranslation } from 'react-i18next';

const RANGE_KEYS = [
    { key: '1m', value: '1mo' },
    { key: '3m', value: '3mo' },
    { key: '6m', value: '6mo' },
    { key: 'ytd', value: 'ytd' },
    { key: '1y', value: '1y' },
    { key: '5y', value: '5y' }
];

export default function FundRangeSelector({ range, setRange }) {
    const { t } = useTranslation('common');
    return (
        <div className="px-6 py-4 flex items-center bg-surface border-b border-border">
            <div className="flex gap-1 bg-surface-2 p-1 rounded-lg border border-border">
                {RANGE_KEYS.map(btn => (
                    <button
                        key={btn.value}
                        onClick={() => setRange(btn.value)}
                        className={`px-4 py-1.5 rounded-md font-bold text-xs transition-all ${
                            range === btn.value ? 'bg-primary text-text shadow-md' : 'text-text-muted hover:text-text hover:bg-surface-hover'
                        }`}
                    >
                        {t(`ranges.${btn.key}`)}
                    </button>
                ))}
            </div>
        </div>
    );
}
