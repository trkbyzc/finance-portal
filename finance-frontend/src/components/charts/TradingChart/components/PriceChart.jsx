import { useRef, useState, useEffect, useMemo } from 'react';
import {
    AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { formatChartDate } from '../../../../utils/formatters/dateFormatter';

// Fiyat ekseni (sağ) bölge genişliği — wheel ile Y-zoom yalnız bu bölgede tetiklenir.
const Y_AXIS_ZONE_PX = 72;

/**
 * Karşılaştırma grafiğiyle aynı açık (beyaz) tooltip — siyah kutu yerine.
 * Modül seviyesinde tanımlı; recharts `content` element'ine ekstra prop'lar geçer,
 * active/payload/label'ı kendisi enjekte eder.
 */
function PriceTooltip({ active, payload, label, stroke, isYield, t, formatPriceLabel }) {
    if (!active || !payload || !payload.length) return null;
    const v = payload[0].value;
    return (
        <div className="bg-surface-2 border border-border p-3 rounded-lg shadow-xl">
            <p className="text-text text-sm mb-1">{formatChartDate(label)}</p>
            <p className="text-sm font-bold flex items-center gap-2" style={{ color: stroke }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stroke }} />
                {isYield
                    ? `${t('yield')}: %${Number(v).toFixed(3)}`
                    : `${t('price')}: ${formatPriceLabel(v)}`}
            </p>
        </div>
    );
}

/**
 * Recharts area veya line chart (klinecharts kullanılmadığı modlarda).
 * useAreaChart=true ise gradient'li alan, false ise düz çizgi.
 * isYield asset (bond) yüzde formatlı eksen kullanır.
 */
export default function PriceChart({
    chartData, useAreaChart, isYield, formatPriceLabel
}) {
    const { t } = useTranslation('charts');
    const wrapRef = useRef(null);
    const [zoom, setZoom] = useState(1);

    // Aralık/asset değişince (veri uzunluğu) zoom'u sıfırla — yeni fiyat aralığına otomatik otur.
    useEffect(() => { setZoom(1); }, [chartData?.length]);

    // Fiyat ekseni bölgesinde (sağ Y_AXIS_ZONE_PX) wheel ile Y-zoom. Non-passive listener —
    // sayfayı kaydırmamak için preventDefault şart (React onWheel passive olabiliyor).
    useEffect(() => {
        const el = wrapRef.current;
        if (!el) return;
        const onWheel = (e) => {
            const rect = el.getBoundingClientRect();
            if (rect.right - e.clientX > Y_AXIS_ZONE_PX) return; // sadece fiyat ekseni üstünde
            e.preventDefault();
            setZoom(z => Math.min(12, Math.max(0.2, z * (e.deltaY < 0 ? 1.12 : 1 / 1.12))));
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, []);

    // Tüm area/line grafikler sistem laciverti (eurobond dahil)
    const stroke = '#2962ff';
    const yTickFormatter = (v) => isYield ? `%${v.toFixed(2)}` : formatPriceLabel(v);
    const tooltipEl = <PriceTooltip stroke={stroke} isYield={isYield} t={t} formatPriceLabel={formatPriceLabel} />;

    // Zoom'a göre Y domain: merkez sabit, açıklık 1/zoom ile daralır/genişler.
    // Zoom yokken (1) recharts'ın kendi otomatik domain'i kullanılır — varsayılan görünüm
    // birebir korunur (regresyon yok). Yalnız kullanıcı scroll'ladığında özel domain devreye girer.
    const yDomain = useMemo(() => {
        if (zoom === 1) return ['auto', 'auto'];
        let lo = Infinity, hi = -Infinity;
        for (const d of chartData || []) {
            const v = d?.close;
            if (Number.isFinite(v)) { if (v < lo) lo = v; if (v > hi) hi = v; }
        }
        if (!Number.isFinite(lo) || !Number.isFinite(hi)) return ['auto', 'auto'];
        const center = (lo + hi) / 2;
        const half = ((hi - lo) / 2) || Math.abs(center * 0.01) || 1;
        const padded = (half * 1.08) / zoom;
        return [center - padded, center + padded];
    }, [chartData, zoom]);

    return (
        <div ref={wrapRef} className="w-full h-full p-4">
            <ResponsiveContainer width="100%" height="100%">
                {useAreaChart ? (
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={stroke} stopOpacity={0.4} />
                                <stop offset="95%" stopColor={stroke} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2e39" vertical={false} />
                        <XAxis dataKey="dateStr" stroke="#787b86" tick={{ fontSize: 11 }} tickFormatter={formatChartDate} />
                        <YAxis
                            stroke="#787b86"
                            orientation="right"
                            domain={yDomain}
                            allowDataOverflow
                            tickFormatter={yTickFormatter}
                        />
                        <RechartsTooltip content={tooltipEl} />
                        <Area type="monotone" dataKey="close" stroke={stroke} strokeWidth={3} fillOpacity={1} fill="url(#colorClose)" connectNulls />
                    </AreaChart>
                ) : (
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2e39" vertical={false} />
                        <XAxis dataKey="dateStr" stroke="#787b86" tick={{ fontSize: 11 }} tickFormatter={formatChartDate} />
                        <YAxis stroke="#787b86" orientation="right" domain={yDomain} allowDataOverflow tickFormatter={yTickFormatter} />
                        <RechartsTooltip content={tooltipEl} />
                        <Line type="monotone" dataKey="close" stroke="#2962ff" strokeWidth={3} dot={false} connectNulls />
                    </LineChart>
                )}
            </ResponsiveContainer>
        </div>
    );
}
