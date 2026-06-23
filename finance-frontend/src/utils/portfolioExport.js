import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Portföy dışa aktarma (Excel + PDF) — ekrandaki Portföyüm sayfasının birebir kopyası.
 * Giriş: { sections, summary: { cards, hasReal }, meta }. Tüm değerler çağırandan FORMATLI
 * gelir (formatPrice ile ₺/birim, işaretli K-Z + yüzde); bu util yalnızca yerleşim yapar.
 */

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

const GREEN = [22, 163, 74];
const RED = [220, 38, 38];
const NAVY = [41, 98, 255];
const TEXT_DARK = [20, 24, 33];
const TEXT_MUTED = [120, 123, 134];

export function exportPortfolioExcel({ sections, summary, meta }) {
    const W = summary.hasReal ? 10 : 8; // bölüm kolon sayısı (Reel K/Z + % varsa +2)
    const aoa = [];
    const merges = [];
    const spanRow = (cells) => { const r = aoa.length; aoa.push(cells); merges.push({ s: { r, c: 0 }, e: { r, c: W - 1 } }); };

    spanRow([meta.title]);
    spanRow([meta.subtitle || '']);
    spanRow([`${meta.dateLabel || ''}: ${meta.date}`]);
    aoa.push([]);

    // Üst özet kartlar (etiket | değer | not) — ekrandaki StatCard'ların karşılığı
    summary.cards.forEach(c => aoa.push([c.label, c.value, c.sub || '']));
    aoa.push([]);

    // Doğa bazlı bölümler — her biri kendi başlık satırı + sütunlarıyla
    sections.forEach(sec => {
        spanRow([`${sec.label} · ${sec.count}`]);
        const head = [sec.headers.asset, sec.headers.type, sec.headers.qty, sec.headers.avg, sec.headers.cur, sec.headers.value, sec.headers.pnl, '%'];
        if (sec.showReal) head.push(sec.headers.realPnl, '%');
        aoa.push(head);
        sec.rows.forEach(r => {
            const row = [r.asset, r.type, r.qty, r.avg, r.cur, r.value, r.pnl, r.pnlPct];
            if (sec.showReal) row.push(r.realPnl, r.realPct);
            aoa.push(row);
        });
        aoa.push([]);
    });

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = [{ wch: 28 }, { wch: 14 }, { wch: 15 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 10 }].slice(0, W);
    ws['!merges'] = merges;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Portföy');
    XLSX.writeFile(wb, `${meta.fileBase}.xlsx`);
}

export async function exportPortfolioPdf({ sections, summary, meta }, logoDataUrl) {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    // Türkçe-uyumlu Roboto'yu yükle. Başarısızsa default font'la devam.
    const fonts = await loadFontBase64();
    applyTurkishFont(doc, fonts);
    const fontFamily = fonts ? 'Roboto' : 'helvetica';

    // Üst bant: logo + başlık + tarih
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

    // Üst özet kartları — yatay kutucuklar (ekrandaki StatCard'ların belge karşılığı)
    let y = 80;
    const cards = summary.cards;
    const gap = 10;
    const cardW = (pageW - 80 - gap * (cards.length - 1)) / cards.length;
    const cardH = 48;
    cards.forEach((c, i) => {
        const x = 40 + i * (cardW + gap);
        doc.setFillColor(245, 247, 250); doc.setDrawColor(224, 228, 233);
        doc.roundedRect(x, y, cardW, cardH, 5, 5, 'FD');
        doc.setFont(fontFamily, 'normal'); doc.setFontSize(7); doc.setTextColor(...TEXT_MUTED);
        doc.text(String(c.label).toUpperCase(), x + 9, y + 15, { maxWidth: cardW - 18 });
        const col = c.positive == null ? TEXT_DARK : (c.positive ? GREEN : RED);
        doc.setFont(fontFamily, 'bold'); doc.setFontSize(11); doc.setTextColor(...col);
        doc.text(String(c.value), x + 9, y + 32, { maxWidth: cardW - 18 });
        if (c.sub) {
            doc.setFont(fontFamily, 'normal'); doc.setFontSize(6.2); doc.setTextColor(...TEXT_MUTED);
            doc.text(String(c.sub), x + 9, y + 43, { maxWidth: cardW - 18 });
        }
    });
    y += cardH + 18;

    // Doğa bazlı bölümler — her biri başlık + kendi sütunlu tablo; K/Z ve Reel K/Z ₺ üstte % altta, renkli
    sections.forEach(sec => {
        if (y > pageH - 90) { doc.addPage(); y = 50; }
        doc.setFont(fontFamily, 'bold'); doc.setFontSize(9); doc.setTextColor(...NAVY);
        doc.text(`${sec.label}  ·  ${sec.count}`, 40, y);
        y += 6;

        const head = [sec.headers.asset, sec.headers.type, sec.headers.qty, sec.headers.avg, sec.headers.cur, sec.headers.value, sec.headers.pnl];
        if (sec.showReal) head.push(sec.headers.realPnl);
        // Başlık hizası gövdeyle birebir olsun (ekrandaki gibi): Varlık/Tip sola, sayısal kolonlar sağa.
        const headRow = head.map((label, i) => ({ content: label, styles: { halign: i <= 1 ? 'left' : 'right' } }));
        const body = sec.rows.map(r => {
            const cells = [
                r.asset, r.type, r.qty, r.avg, r.cur, r.value,
                { content: `${r.pnl}\n${r.pnlPct}`, styles: { textColor: r.pnlPositive ? GREEN : RED, fontStyle: 'bold' } },
            ];
            if (sec.showReal) {
                cells.push({ content: r.realPct ? `${r.realPnl}\n${r.realPct}` : r.realPnl, styles: { textColor: r.realPositive ? GREEN : RED, fontStyle: 'bold' } });
            }
            return cells;
        });
        autoTable(doc, {
            startY: y,
            head: [headRow],
            body,
            styles: { font: fontFamily, fontSize: 7.5, cellPadding: 4, textColor: TEXT_DARK },
            headStyles: { font: fontFamily, fillColor: NAVY, textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
            alternateRowStyles: { fillColor: [245, 247, 250] },
            columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' }, 7: { halign: 'right' } },
            margin: { left: 40, right: 40 },
        });
        y = (doc.lastAutoTable?.finalY || y) + 22;
    });

    doc.setFontSize(8); doc.setTextColor(150, 150, 150);
    doc.text(meta.footer || 'FinansPortal', pageW - 40, pageH - 20, { align: 'right' });
    doc.save(`${meta.fileBase}.pdf`);
}
