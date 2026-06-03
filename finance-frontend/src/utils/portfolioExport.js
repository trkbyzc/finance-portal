import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Portföy dışa aktarma (Excel + PDF) — sisteme uygun, logolu belge.
 *
 * rows:    [{ symbol, type, quantity, avgPrice, currentPrice, currentValue, pnl, pnlPct, currency }]
 * summary: { totalCost, totalValue, totalPnl, returnRate }
 * meta:    { title, subtitle, date, headers: {...} }  (i18n metinleri çağırandan gelir)
 */

const n2 = (v) => (v == null || Number.isNaN(Number(v)) ? 0 : Math.round(Number(v) * 100) / 100);

/** /finanslogo.png → dataURL (PDF'e gömmek için). Hata olursa null döner (logo atlanır). */
export async function loadLogoDataUrl() {
    try {
        const res = await fetch('/finanslogo.png');
        const blob = await res.blob();
        return await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch {
        return null;
    }
}

// ---------- TTF font loader (Türkçe karakter desteği için) ----------
// jsPDF default'ları WinAnsi encoding kullanıyor → ş/ğ/İ gibi Turkish glyph'ler kaybolur ve
// boş glyph yerine '&' separator basar ("&V&a&r&l&1&k" gibi bozuk output). Çözüm: TTF embed.
// public/fonts/Roboto-{Regular,Bold}.ttf'yi base64'e çevirip jsPDF VFS'e ekliyoruz.
let _fontCache = null;
async function fetchAsBase64(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Font fetch failed: ${url}`);
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const dataUrl = reader.result || '';
            const i = dataUrl.indexOf(',');
            resolve(i >= 0 ? dataUrl.slice(i + 1) : dataUrl);
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
    });
}

/** Roboto Regular + Bold'u base64'e indirir, cache'ler. Hata olursa null döner (default font'a fallback). */
async function loadFontBase64() {
    if (_fontCache !== null) return _fontCache;
    try {
        const [regular, bold] = await Promise.all([
            fetchAsBase64('/fonts/Roboto-Regular.ttf'),
            fetchAsBase64('/fonts/Roboto-Bold.ttf')
        ]);
        _fontCache = { regular, bold };
        return _fontCache;
    } catch {
        _fontCache = false; // false = denemiştik, başarısız oldu
        return null;
    }
}

/** doc'a Roboto'yu kaydedip default font olarak set'ler. Başarısızsa hiçbir şey yapmaz. */
function applyTurkishFont(doc, fonts) {
    if (!fonts || !fonts.regular || !fonts.bold) return;
    doc.addFileToVFS('Roboto-Regular.ttf', fonts.regular);
    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    doc.addFileToVFS('Roboto-Bold.ttf', fonts.bold);
    doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
    doc.setFont('Roboto', 'normal');
}

export function exportPortfolioExcel(rows, summary, meta) {
    const h = meta.headers;
    const headerRow = [h.asset, h.type, h.quantity, h.avgPrice, h.currentPrice, h.value, h.pnl, h.pnlPct, h.currency];
    const aoa = [
        [meta.title],
        [meta.subtitle || ''],
        [`${meta.dateLabel || ''}: ${meta.date}`],
        [],
        headerRow,
        ...rows.map(r => [
            r.symbol, r.type, n2(r.quantity), n2(r.avgPrice), n2(r.currentPrice),
            n2(r.currentValue), n2(r.pnl), n2(r.pnlPct), r.currency
        ]),
        [],
        [h.totalCost, n2(summary.totalCost)],
        [h.totalValue, n2(summary.totalValue)],
        [h.totalPnl, n2(summary.totalPnl)],
        [h.returnRate, n2(summary.returnRate)]
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa);

    // Sütun genişlikleri (karakter cinsinden)
    ws['!cols'] = [{ wch: 26 }, { wch: 18 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 10 }, { wch: 10 }];

    // Hücre birleştirmeleri: başlık + altbaşlık + tarih satırlarını tablonun 9 sütununa yay
    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: headerRow.length - 1 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: headerRow.length - 1 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: headerRow.length - 1 } }
    ];

    // Hücre stilleri (xlsx CE styling sınırlı; sadece number format ve alignment uygulayabiliriz).
    // Sayısal sütunlar (qty/price/value/pnl) için 2 decimal display formatı.
    const numFmt = '#,##0.00';
    const dataStart = 5; // 0-index: 4 başlık satır + header
    for (let i = 0; i < rows.length; i++) {
        const r = dataStart + i;
        ['C', 'D', 'E', 'F', 'G'].forEach(col => {
            const addr = `${col}${r + 1}`;
            if (ws[addr]) ws[addr].z = numFmt;
        });
        const pctAddr = `H${r + 1}`;
        if (ws[pctAddr]) ws[pctAddr].z = '0.00"%"';
    }

    // Özet satırlarında sayı kolonu (B) için de aynı format
    const summaryStart = dataStart + rows.length + 1;
    for (let i = 0; i < 4; i++) {
        const addr = `B${summaryStart + i + 1}`;
        if (ws[addr]) ws[addr].z = i === 3 ? '0.00"%"' : numFmt;
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Portföy');
    XLSX.writeFile(wb, `${meta.fileBase}.xlsx`);
}

export async function exportPortfolioPdf(rows, summary, meta, logoDataUrl) {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const NAVY = [41, 98, 255];
    const TEXT_DARK = [20, 24, 33];
    const TEXT_MUTED = [120, 123, 134];

    // Türkçe-uyumlu Roboto'yu yükle (Roboto Regular + Bold). Başarısızsa default font'la devam.
    const fonts = await loadFontBase64();
    applyTurkishFont(doc, fonts);
    const fontFamily = fonts ? 'Roboto' : 'helvetica';

    // Üst bant: logo + başlık
    if (logoDataUrl) {
        try { doc.addImage(logoDataUrl, 'PNG', 40, 28, 36, 36); } catch { /* logo atlanır */ }
    }
    doc.setFont(fontFamily, 'bold');
    doc.setFontSize(16); doc.setTextColor(...TEXT_DARK);
    doc.text(meta.title, logoDataUrl ? 86 : 40, 48);
    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(9); doc.setTextColor(...TEXT_MUTED);
    if (meta.subtitle) doc.text(meta.subtitle, logoDataUrl ? 86 : 40, 62);
    doc.text(`${meta.dateLabel || ''}: ${meta.date}`, pageW - 40, 48, { align: 'right' });

    const h = meta.headers;
    autoTable(doc, {
        startY: 80,
        head: [[h.asset, h.type, h.quantity, h.avgPrice, h.currentPrice, h.value, h.pnl, h.pnlPct, h.currency]],
        body: rows.map(r => [
            r.symbol, r.type, n2(r.quantity), n2(r.avgPrice), n2(r.currentPrice),
            n2(r.currentValue), `${r.pnl >= 0 ? '+' : ''}${n2(r.pnl)}`,
            `${r.pnlPct >= 0 ? '+' : ''}${n2(r.pnlPct)}%`, r.currency
        ]),
        styles: { font: fontFamily, fontSize: 8, cellPadding: 4 },
        headStyles: { font: fontFamily, fillColor: NAVY, textColor: 255, fontStyle: 'bold' },
        bodyStyles: { font: fontFamily, fontStyle: 'normal' },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' }, 7: { halign: 'right' } }
    });

    let y = (doc.lastAutoTable?.finalY || 80) + 20;
    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(10); doc.setTextColor(...TEXT_DARK);
    const line = (label, val) => { doc.text(`${label}: ${n2(val)}`, 40, y); y += 16; };
    line(h.totalCost, summary.totalCost);
    line(h.totalValue, summary.totalValue);
    line(h.totalPnl, summary.totalPnl);
    line(h.returnRate, summary.returnRate);

    doc.setFontSize(8); doc.setTextColor(150, 150, 150);
    doc.text(meta.footer || 'FinansPortal', pageW - 40, doc.internal.pageSize.getHeight() - 20, { align: 'right' });

    doc.save(`${meta.fileBase}.pdf`);
}
