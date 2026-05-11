import React from 'react';

export default function ViopControls({ range, handleRangeChange, fromDate, toDate }) {
    const ranges = [ {l:'H', v:'1w'}, {l:'A', v:'1mo'}, {l:'Y', v:'1y'} ];

    return (
        <div className="px-6 py-4 flex items-center justify-between bg-[#131722] border-b border-[#2a2e39]">
            <div className="flex gap-2 bg-[#1e222d] p-1 rounded-lg border border-[#2a2e39]">
                {ranges.map(btn => (
                    <button
                        key={btn.v}
                        onClick={() => handleRangeChange(btn.v)}
                        className={`w-9 h-9 rounded-md flex items-center justify-center font-bold text-xs transition-all ${
                            range === btn.v ? 'bg-[#2962ff] text-white' : 'text-[#868993] hover:text-white hover:bg-[#2a2e39]'
                        }`}
                    >
                        {btn.l}
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-3">
                <input type="date" value={fromDate} readOnly className="bg-[#1e222d] border border-[#2a2e39] rounded-lg px-3 py-2 text-xs text-white focus:outline-none [color-scheme:dark] opacity-70 cursor-not-allowed" />
                <span className="text-[#2a2e39]">-</span>
                <input type="date" value={toDate} readOnly className="bg-[#1e222d] border border-[#2a2e39] rounded-lg px-3 py-2 text-xs text-white focus:outline-none [color-scheme:dark] opacity-70 cursor-not-allowed" />
            </div>
        </div>
    );
}