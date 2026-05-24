import React from 'react';
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

            <div className="flex items-center gap-3">
                <input
                    type="date"
                    value={fromDate}
                    readOnly
                    className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-text font-mono focus:outline-none opacity-70 cursor-not-allowed"
                />
                <span className="text-text-muted">→</span>
                <input
                    type="date"
                    value={toDate}
                    readOnly
                    className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-text font-mono focus:outline-none opacity-70 cursor-not-allowed"
                />
            </div>
        </div>
    );
}
