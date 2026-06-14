/**
 * WhatIfPage ve alt komponentleri için paylaşılan sabitler/helper'lar.
 * Asset chip ve recharts Line aynı index'te aynı rengi kullansın diye PALETTE shared.
 */
export const PALETTE = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

export const fmtTry = (v) =>
    Number(v ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * What-If karşılaştırma serisini line-chart için hazırlar (saf fonksiyon → test edilebilir).
 *
 * PROBLEM: Backend her varlığı AYRI AYRI max 300 noktaya downsample eder. Farklı uzunluk +
 * granularitedeki varlıkların (kaba aylık hisse vs günlük döviz) tarih ızgaraları birbirini
 * tutmaz. Naif date-merge'de her satırda yalnızca BAZI varlıkların değeri olur →
 *   (a) tooltip'te hep 1-2 varlık eksik çıkar,
 *   (b) endeks modunda base hizalanmaz, çizgiler kaybolabilir (sadece biri görünür).
 *
 * ÇÖZÜM: Tüm varlıkların tarihlerinin BİRLEŞİMİNDEN ortak bir eksen kurup her varlığı bu
 * eksene LİNEER İNTERPOLE ederek doldururuz. Böylece her satırda her varlığın değeri olur.
 * Çizgi şekli birebir aynı kalır: gerçek noktalar arası zaten düz çizgi çizilir, interpolasyon
 * o düz çizgi üzerindeki ara noktaları verir. Varlığın ilk/son gerçek noktasının DIŞINA taşmaz.
 *
 * sharedStart: her varlığın ilk gerçek tarihinin EN GEÇ olanı; öncesi kesilir ki "USD 1 ay
 * önden başlamış" yanılgısı olmasın. limitingLabel = bu tarihi belirleyen (en geç başlayan)
 * varlığın etiketi — kullanıcıya "X verisi şu tarihte başlıyor" notu için.
 *
 * @param {{investmentDate?:string, assets?:Array}} result  backend WhatIfResultDto
 * @param {'indexed'|'absolute'} mode
 * @returns {{ chartData: Array, sharedStart: string|null, limitingLabel: string|null }}
 */
export function buildComparisonSeries(result, mode) {
    const empty = { chartData: [], sharedStart: null, limitingLabel: null };
    if (!result || !Array.isArray(result.assets) || result.assets.length === 0) return empty;

    // 1. Her varlık için temiz, sıralı, value>0 gerçek noktalar.
    const pointsByKey = new Map();
    result.assets.forEach((a) => {
        const pts = (a.series || [])
            .map((p) => ({ date: p.date, value: Number(p.value) }))
            .filter((p) => p.date && Number.isFinite(p.value) && p.value > 0)
            .sort((x, y) => x.date.localeCompare(y.date));
        pointsByKey.set(a.key, pts);
    });

    // 2. sharedStart = ilk-tarihlerin EN GEÇ olanı; o varlık = limiting. (ISO string compare ok.)
    let sharedStart = null;
    let limitingLabel = null;
    result.assets.forEach((a) => {
        const pts = pointsByKey.get(a.key);
        if (!pts || pts.length === 0) return;
        if (sharedStart === null || pts[0].date > sharedStart) {
            sharedStart = pts[0].date;
            limitingLabel = a.label || a.symbol;
        }
    });
    if (sharedStart === null) return empty;

    // 3. Ortak eksen = sharedStart'tan itibaren tüm gerçek tarihlerin birleşimi (tekil, sıralı).
    const axisSet = new Set();
    pointsByKey.forEach((pts) => pts.forEach((p) => { if (p.date >= sharedStart) axisSet.add(p.date); }));
    const axis = Array.from(axisSet).sort((a, b) => a.localeCompare(b));
    if (axis.length === 0) return empty;

    // 4. Her varlığı eksene lineer interpole et. Varlığın ilk/son gerçek noktası dışına TAŞMA.
    const ms = (d) => Date.parse(d); // ISO yyyy-MM-dd → epoch ms; gün oranı için yeterli.
    const filled = new Map(); // key -> Map(date -> value)
    result.assets.forEach((a) => {
        const pts = pointsByKey.get(a.key) || [];
        const m = new Map();
        if (pts.length > 0) {
            const firstD = pts[0].date;
            const lastD = pts[pts.length - 1].date;
            let i = 0; // sol bracket pointer (axis sıralı → monoton ilerler)
            for (const d of axis) {
                if (d < firstD || d > lastD) continue; // varlık aralığı dışı → değer yok
                while (i < pts.length - 1 && pts[i + 1].date <= d) i++;
                const lo = pts[i];
                if (d === lo.date) { m.set(d, lo.value); continue; }
                const hi = pts[i + 1];
                if (hi) {
                    const t = (ms(d) - ms(lo.date)) / (ms(hi.date) - ms(lo.date));
                    m.set(d, lo.value + (hi.value - lo.value) * t);
                }
            }
        }
        filled.set(a.key, m);
    });

    // 5. Satırları kur: her eksen tarihinde her varlığın (interpole) değeri.
    const rows = axis.map((d) => {
        const row = { date: d };
        result.assets.forEach((a) => {
            const v = filled.get(a.key).get(d);
            if (Number.isFinite(v)) row[a.key] = v;
        });
        return row;
    });

    if (mode === 'absolute') return { chartData: rows, sharedStart, limitingLabel };

    // 6. Endeks: her varlığın ilk dolu (sharedStart) değeri = base → 100.
    const baseByKey = new Map();
    result.assets.forEach((a) => {
        const m = filled.get(a.key);
        for (const d of axis) {
            const v = m.get(d);
            if (Number.isFinite(v) && v > 0) { baseByKey.set(a.key, v); break; }
        }
    });
    const indexed = rows.map((row) => {
        const next = { date: row.date };
        result.assets.forEach((a) => {
            const v = row[a.key];
            const base = baseByKey.get(a.key);
            if (Number.isFinite(v) && base) next[a.key] = (v / base) * 100;
        });
        return next;
    });
    return { chartData: indexed, sharedStart, limitingLabel };
}
