/**
 * Eurobond dashboard'unun palet sabitleri + ortak ufak component'ler.
 */
import React from 'react';

export const EMB_SYMBOL = 'EMB';

export const COLOR_PRIMARY = '#ff9800';
export const COLOR_USD = '#2962ff';
export const COLOR_EUR = '#089981';
export const COLOR_JPY = '#9c27b0';
export const COLOR_OTHER = '#ff9800';

export const RANGE_KEYS = ['1y', '5y', '10y', 'all'];

export function SectionHeader({ title, sub }) {
    return (
        <div className="flex items-baseline gap-3 mb-4">
            <div className="w-1.5 h-7 rounded bg-warning" />
            <h2 className="text-xl font-bold text-text">{title}</h2>
            <span className="text-xs text-text-muted">{sub}</span>
        </div>
    );
}

export function ChartCard({ title, subtitle, children, wide }) {
    return (
        <div className={`bg-surface border border-border rounded-2xl p-5 shadow-xl ${wide ? 'lg:col-span-2' : ''}`}>
            <div className="mb-3">
                <div className="font-semibold text-text">{title}</div>
                <div className="text-xs text-text-muted">{subtitle}</div>
            </div>
            {children}
        </div>
    );
}

export function KpiCard({ icon, label, value, sub, subColor, accent }) {
    return (
        <div className="bg-surface border border-border p-5 rounded-xl flex items-center justify-between shadow-lg">
            <div>
                <div className="text-[10px] uppercase text-text-muted mb-1 font-semibold tracking-wider">{label}</div>
                <div className="text-2xl font-bold font-mono" style={{ color: accent }}>{value}</div>
                <div className="text-xs font-mono mt-1" style={{ color: subColor }}>{sub}</div>
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${accent}1a`, color: accent }}>
                {icon}
            </div>
        </div>
    );
}
