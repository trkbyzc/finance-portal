import React from 'react';

const RANGES = [
    { label: '1A', value: '1mo' },
    { label: '3A', value: '3mo' },
    { label: '6A', value: '6mo' },
    { label: 'YTD', value: 'ytd' },
    { label: '1Y', value: '1y' },
    { label: '3Y', value: '3y' },
    { label: '5Y', value: '5y' }
];

export default function FundRangeSelector({ range, setRange }) {
    return (
        <div className="px-6 py-4 flex items-center bg-[#131722] border-b border-[#2a2e39]">
            <div className="flex gap-1 bg-[#1e222d] p-1 rounded-lg border border-[#2a2e39]">
                {RANGES.map(btn => (
                    <button
                        key={btn.value}
                        onClick={() => setRange(btn.value)}
                        className={`px-4 py-1.5 rounded-md font-bold text-xs transition-all ${
                            range === btn.value ? 'bg-[#2962ff] text-white shadow-md' : 'text-[#868993] hover:text-white hover:bg-[#2a2e39]'
                        }`}
                    >
                        {btn.label}
                    </button>
                ))}
            </div>
        </div>
    );
}