import React from 'react';
import { fgColor } from '../../../../utils/fearGreed';

// Yarım daire gauge: 0 (sol) → 100 (sağ). Açı = 180 - değer*1.8.
const CX = 100, CY = 100, R = 82, SW = 15;
const angleFor = (v) => 180 - (Math.max(0, Math.min(100, v)) * 1.8);
const pt = (deg) => {
    const a = (deg * Math.PI) / 180;
    return [CX + R * Math.cos(a), CY - R * Math.sin(a)];
};
// Yayı polyline (örneklenmiş noktalar) ile çiz — SVG arc flag belirsizliği olmaz.
const arc = (startDeg, endDeg, steps = 16) => {
    const pts = [];
    for (let i = 0; i <= steps; i++) {
        const a = startDeg + ((endDeg - startDeg) * i) / steps;
        const [x, y] = pt(a);
        pts.push(`${x.toFixed(2)} ${y.toFixed(2)}`);
    }
    return 'M ' + pts.join(' L ');
};

const SEGMENTS = [
    { from: 0, to: 25, color: '#ea3943' },
    { from: 25, to: 45, color: '#f3841e' },
    { from: 45, to: 55, color: '#f3d42f' },
    { from: 55, to: 75, color: '#93d900' },
    { from: 75, to: 100, color: '#16c784' }
];

/** Anlık F&G değeri için yarım daire gauge — renkli yay + üzerinde nokta + ortada değer/etiket. */
export default function FearGreedGauge({ value, label }) {
    const v = Number(value) || 0;
    const [dx, dy] = pt(angleFor(v));
    const color = fgColor(v);

    return (
        <div className="flex flex-col items-center">
            <svg viewBox="0 0 200 118" className="w-52 max-w-full">
                {SEGMENTS.map((s) => (
                    <path
                        key={s.from}
                        d={arc(angleFor(s.from), angleFor(s.to))}
                        stroke={s.color}
                        strokeWidth={SW}
                        strokeLinecap="round"
                        fill="none"
                    />
                ))}
                <circle cx={dx} cy={dy} r="7" fill="var(--color-text)" stroke="var(--color-surface)" strokeWidth="3" />
                <text x={CX} y="86" textAnchor="middle" className="font-black" style={{ fontSize: 34, fill: color }}>{v}</text>
                <text x={CX} y="106" textAnchor="middle" style={{ fontSize: 12, fill: 'var(--color-text-muted)' }}>{label}</text>
            </svg>
        </div>
    );
}
