import React, { useState, useMemo } from 'react';
import { ArrowLeft, Landmark, TrendingUp, Calendar, PieChart as PieIcon, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { bondFundApi, historicalApi } from '../../../../services/api';

const EMB_SYMBOL = 'EMB';

const COLOR_PRIMARY = '#ff9800';
const COLOR_USD = '#2962ff';
const COLOR_EUR = '#089981';
const COLOR_JPY = '#9c27b0';
const COLOR_OTHER = '#ff9800';

const RANGES = [
    { key: '1y', label: '1Y' },
    { key: '5y', label: '5Y' },
    { key: '10y', label: '10Y' },
    { key: 'all', label: 'Tümü' }
];

const CurrencyTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const p = payload[0];
    return (
        <div className="bg-[#0b0e14] border border-[#2a2e39] px-3 py-2 rounded text-xs">
            <div className="text-[#868993]">{p.name}</div>
            <div className="font-mono font-bold" style={{ color: p.payload.fill || p.color }}>%{Number(p.value).toFixed(1)}</div>
        </div>
    );
};

const EmbTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const p = payload[0];
    const raw = p.payload.close ?? p.payload.price ?? p.value;
    return (
        <div className="bg-[#0b0e14] border border-[#2a2e39] px-3 py-2 rounded text-xs">
            <div className="text-[#868993]">{p.payload.date}</div>
            <div className="font-mono font-bold text-[#ff9800]">${Number(raw).toFixed(2)}</div>
        </div>
    );
};

export default function EurobondDashboard() {
    const navigate = useNavigate();
    const [activeRange, setActiveRange] = useState('5y');

    const { data: eurobondList = [], isLoading: listLoading } = useQuery({
        queryKey: ['eurobond-list'],
        queryFn: async () => (await bondFundApi.getEurobondList()) || []
    });

    const { data: embHistory = [], isLoading: embLoading } = useQuery({
        queryKey: ['emb-chart', activeRange],
        queryFn: async () => {
            const res = await historicalApi.getData({ symbol: EMB_SYMBOL, category: 'EUROBOND', range: activeRange, interval: '1d' });
            const arr = Array.isArray(res) ? res : (res?.priceData || res || []);
            return arr
                .filter(p => p && (p.close != null || p.price != null))
                .map(p => ({
                    date: Array.isArray(p.date) ? `${p.date[0]}-${String(p.date[1]).padStart(2, '0')}-${String(p.date[2]).padStart(2, '0')}` : p.date,
                    close: Number(p.close ?? p.price)
                }))
                .filter(p => p.date && !Number.isNaN(p.close));
        }
    });

    const { data: aggregate, isLoading: aggLoading } = useQuery({
        queryKey: ['eurobond-aggregate'],
        queryFn: async () => (await bondFundApi.getEurobondAggregate()) || null
    });

    const embAsset = eurobondList[0] || null;
    const lastPrice = embAsset?.price ? Number(embAsset.price) : null;
    const lastChange = embAsset?.changePercent != null ? Number(embAsset.changePercent) : null;

    const totalStockUsd = useMemo(() => {
        const arr = aggregate?.totalStockByYear || [];
        if (!arr.length) return null;
        const last = arr[arr.length - 1];
        return last?.value != null ? Number(last.value) : null;
    }, [aggregate]);

    const handleAssetClick = () => {
        if (!embAsset) return;
        navigate(`/chart/${encodeURIComponent(embAsset.symbol)}?cat=EUROBOND`);
    };

    const hasAggregate = aggregate &&
        ((aggregate.totalStockByYear?.length || 0) +
         (aggregate.currencyMix?.length || 0) +
         (aggregate.maturityMix?.length || 0)) > 0;

    return (
        <div className="min-h-screen bg-[#0b0e14] text-white p-6 lg:p-10">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-[#868993] hover:text-white mb-6 transition bg-[#1e222d] px-4 py-2 rounded-lg border border-[#2a2e39]"
            >
                <ArrowLeft size={18} /> Geri Dön
            </button>

            <div className="mb-8 flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-[#ff9800]/10 border border-[#ff9800]/30 flex items-center justify-center text-[#ff9800]">
                    <Landmark size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Türkiye Eurobond</h1>
                    <p className="text-[#868993] text-sm mt-1">Türkiye'nin dış borçlanma görünümü ve USD cinsi gelişmekte olan ülke tahvil ETF'i (proxy)</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                <KpiCard
                    icon={<TrendingUp size={20} />}
                    label="EMB ETF Fiyatı"
                    value={lastPrice != null ? `$${lastPrice.toFixed(2)}` : '—'}
                    sub={lastChange != null ? `${lastChange >= 0 ? '+' : ''}${lastChange.toFixed(2)}% bugün` : (listLoading ? 'Yükleniyor…' : 'Veri yok')}
                    subColor={lastChange != null ? (lastChange >= 0 ? '#089981' : '#f23645') : '#868993'}
                    accent="#ff9800"
                />
                <KpiCard
                    icon={<BarChart3 size={20} />}
                    label="Toplam Eurobond Stoku"
                    value={totalStockUsd != null ? `${(totalStockUsd / 1000).toFixed(1)}B USD` : '—'}
                    sub={hasAggregate ? 'Son veri' : (aggLoading ? 'Yükleniyor…' : 'EVDS bekleniyor')}
                    subColor="#868993"
                    accent="#2962ff"
                />
                <KpiCard
                    icon={<Calendar size={20} />}
                    label="Son Güncelleme"
                    value={aggregate?.lastUpdated ? new Date(aggregate.lastUpdated).toLocaleDateString('tr-TR') : '—'}
                    sub="EVDS / FRED"
                    subColor="#868993"
                    accent="#089981"
                />
            </div>

            {/* Türkiye Dış Borçlanma Görünümü */}
            <SectionHeader title="Türkiye Dış Borçlanma Görünümü" sub="EVDS aggregate verileri" />

            {!hasAggregate ? (
                <div className="bg-[#131722] border border-[#2a2e39] rounded-2xl p-12 text-center text-[#868993] mb-10">
                    <PieIcon size={40} className="mx-auto mb-3 opacity-40" />
                    <div className="font-semibold mb-1 text-white">EVDS Aggregate Verisi Henüz Bağlanmadı</div>
                    <div className="text-sm">Toplam stok, döviz cinsi ve vade dağılımı yakında.</div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
                    <ChartCard title="Toplam Eurobond Stoku (Yıllara Göre)" subtitle="USD milyon">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={aggregate.totalStockByYear}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#2a2e39" vertical={false} />
                                <XAxis dataKey="year" stroke="#787b86" tick={{ fontSize: 11 }} />
                                <YAxis stroke="#787b86" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}B`} />
                                <Tooltip contentStyle={{ backgroundColor: '#1e222d', border: '1px solid #2a2e39' }} formatter={(v) => [`${Number(v).toLocaleString()} M$`, 'Stok']} />
                                <Bar dataKey="value" fill={COLOR_PRIMARY} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    <ChartCard title="Döviz Cinsi Dağılımı" subtitle="Pay (%)">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={aggregate.currencyMix}
                                    dataKey="value"
                                    nameKey="currency"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    label={(e) => `${e.currency} %${Number(e.value).toFixed(1)}`}
                                    labelLine={false}
                                >
                                    {(aggregate.currencyMix || []).map((entry, idx) => (
                                        <Cell key={idx} fill={
                                            entry.currency === 'USD' ? COLOR_USD :
                                            entry.currency === 'EUR' ? COLOR_EUR :
                                            entry.currency === 'JPY' ? COLOR_JPY : COLOR_OTHER
                                        } />
                                    ))}
                                </Pie>
                                <Tooltip content={<CurrencyTooltip />} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    <ChartCard title="Vade Dağılımı" subtitle="Pay (%)" wide>
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={aggregate.maturityMix} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#2a2e39" horizontal={false} />
                                <XAxis type="number" stroke="#787b86" tick={{ fontSize: 11 }} tickFormatter={(v) => `%${v}`} />
                                <YAxis type="category" dataKey="bucket" stroke="#787b86" tick={{ fontSize: 11 }} width={120} />
                                <Tooltip contentStyle={{ backgroundColor: '#1e222d', border: '1px solid #2a2e39' }} formatter={(v) => [`%${Number(v).toFixed(1)}`, 'Pay']} />
                                <Bar dataKey="value" fill={COLOR_PRIMARY} radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>
            )}

            {/* EMB ETF Price Chart (USD EM Bond proxy) */}
            <SectionHeader title="EMB ETF (USD EM Bond Proxy)" sub="iShares J.P. Morgan USD Emerging Markets Bond · Yahoo · günlük" />

            <div className="bg-[#131722] border border-[#2a2e39] rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <div>
                        <div className="text-2xl font-bold font-mono text-[#ff9800]">
                            {lastPrice != null ? `$${lastPrice.toFixed(2)}` : '—'}
                        </div>
                        <div className="text-xs text-[#868993]">Son fiyat (USD)</div>
                    </div>
                    <div className="flex gap-2">
                        {RANGES.map(r => (
                            <button
                                key={r.key}
                                onClick={() => setActiveRange(r.key)}
                                className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
                                    activeRange === r.key
                                        ? 'bg-[#ff9800] text-white'
                                        : 'bg-[#1e222d] text-[#868993] hover:text-white border border-[#2a2e39]'
                                }`}
                            >
                                {r.label}
                            </button>
                        ))}
                        <button
                            onClick={handleAssetClick}
                            disabled={!embAsset}
                            className="px-3 py-1.5 rounded text-xs font-semibold bg-[#2962ff]/20 text-[#2962ff] border border-[#2962ff]/30 hover:bg-[#2962ff]/30 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            Detay Sayfası →
                        </button>
                    </div>
                </div>

                {embLoading ? (
                    <div className="h-[400px] flex items-center justify-center text-[#868993]">Yükleniyor…</div>
                ) : embHistory.length === 0 ? (
                    <div className="h-[400px] flex items-center justify-center text-[#868993]">Veri yok. Yahoo'dan EMB çekilemedi.</div>
                ) : (
                    <ResponsiveContainer width="100%" height={400}>
                        <AreaChart data={embHistory}>
                            <defs>
                                <linearGradient id="embFill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ff9800" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#ff9800" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2a2e39" vertical={false} />
                            <XAxis dataKey="date" stroke="#787b86" tick={{ fontSize: 11 }} minTickGap={40} />
                            <YAxis stroke="#787b86" orientation="right" tick={{ fontSize: 11 }} domain={['auto', 'auto']} tickFormatter={(v) => `$${v.toFixed(0)}`} />
                            <Tooltip content={<EmbTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="close"
                                stroke="#ff9800"
                                strokeWidth={2.5}
                                fillOpacity={1}
                                fill="url(#embFill)"
                                onClick={handleAssetClick}
                                style={{ cursor: embAsset ? 'pointer' : 'default' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}

                <div className="mt-4 text-xs text-[#868993] border-t border-[#2a2e39] pt-3">
                    <strong className="text-[#ff9800]">Not:</strong> EMB ETF, gelişmekte olan ülkelerin USD cinsi devlet tahvillerini izleyen J.P. Morgan endeksini taklit eder.
                    Türkiye bu ETF'in yaklaşık %8-10'unu oluşturur, bu yüzden Türkiye Eurobond fiyat hareketleri için en pratik açık-kaynak proxy'sidir.
                    Doğrudan Türkiye USD bond yield serisi ücretsiz açık kaynaklarda bulunmamaktadır (Bloomberg/Reuters terminal verisi olarak sağlanır).
                </div>
            </div>
        </div>
    );
}

function KpiCard({ icon, label, value, sub, subColor, accent }) {
    return (
        <div className="bg-[#131722] border border-[#2a2e39] p-5 rounded-xl flex items-center justify-between shadow-lg">
            <div>
                <div className="text-[10px] uppercase text-[#868993] mb-1 font-semibold tracking-wider">{label}</div>
                <div className="text-2xl font-bold font-mono" style={{ color: accent }}>{value}</div>
                <div className="text-xs font-mono mt-1" style={{ color: subColor }}>{sub}</div>
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${accent}1a`, color: accent }}>
                {icon}
            </div>
        </div>
    );
}

function SectionHeader({ title, sub }) {
    return (
        <div className="flex items-baseline gap-3 mb-4">
            <div className="w-1.5 h-7 rounded bg-[#ff9800]" />
            <h2 className="text-xl font-bold text-white">{title}</h2>
            <span className="text-xs text-[#868993]">{sub}</span>
        </div>
    );
}

function ChartCard({ title, subtitle, children, wide }) {
    return (
        <div className={`bg-[#131722] border border-[#2a2e39] rounded-2xl p-5 shadow-xl ${wide ? 'lg:col-span-2' : ''}`}>
            <div className="mb-3">
                <div className="font-semibold text-white">{title}</div>
                <div className="text-xs text-[#868993]">{subtitle}</div>
            </div>
            {children}
        </div>
    );
}
