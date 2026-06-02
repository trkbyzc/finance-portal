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

export function exportPortfolioExcel(rows, summary, meta) {
    const h = meta.headers;
    const aoa = [
        [meta.title],
        [meta.subtitle || ''],
        [`${meta.dateLabel || ''}: ${meta.date}`],
        [],
        [h.asset, h.type, h.quantity, h.avgPrice, h.currentPrice, h.value, h.pnl, h.pnlPct, h.currency],
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
    ws['!cols'] = [{ wch: 22 }, { wch: 16 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 10 }, { wch: 8 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Portföy');
    XLSX.writeFile(wb, `${meta.fileBase}.xlsx`);
}

export function exportPortfolioPdf(rows, summary, meta, logoDataUrl) {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const NAVY = [41, 98, 255];

    // Üst bant: logo + başlık
    if (logoDataUrl) {
        try { doc.addImage(logoDataUrl, 'PNG', 40, 28, 36, 36); } catch { /* logo atlanır */ }
    }
    doc.setFontSize(16); doc.setTextColor(20, 24, 33);
    doc.text(meta.title, logoDataUrl ? 86 : 40, 48);
    doc.setFontSize(9); doc.setTextColor(120, 123, 134);
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
        styles: { fontSize: 8, cellPadding: 4 },
        headStyles: { fillColor: NAVY, textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' }, 7: { halign: 'right' } }
    });

    let y = (doc.lastAutoTable?.finalY || 80) + 20;
    doc.setFontSize(10); doc.setTextColor(20, 24, 33);
    const line = (label, val) => { doc.text(`${label}: ${n2(val)}`, 40, y); y += 16; };
    line(h.totalCost, summary.totalCost);
    line(h.totalValue, summary.totalValue);
    line(h.totalPnl, summary.totalPnl);
    line(h.returnRate, summary.returnRate);

    doc.setFontSize(8); doc.setTextColor(150, 150, 150);
    doc.text(meta.footer || 'FinansPortal', pageW - 40, doc.internal.pageSize.getHeight() - 20, { align: 'right' });

    doc.save(`${meta.fileBase}.pdf`);
}
