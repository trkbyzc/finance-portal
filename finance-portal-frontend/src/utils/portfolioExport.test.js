import { describe, it, expect, vi, beforeEach } from 'vitest';

const { xlsxMock, pdfMock, autoTableMock } = vi.hoisted(() => {
    const ws = {};
    const wb = {};
    return {
        xlsxMock: {
            utils: {
                aoa_to_sheet: vi.fn(() => ws),
                book_new: vi.fn(() => wb),
                book_append_sheet: vi.fn(),
            },
            writeFile: vi.fn(),
        },
        pdfMock: vi.fn(),
        autoTableMock: vi.fn(),
    };
});

vi.mock('xlsx', () => ({ ...xlsxMock, default: xlsxMock }));
vi.mock('jspdf', () => {
    return {
        jsPDF: vi.fn(function () {
            const doc = {
                internal: { pageSize: { getWidth: () => 800, getHeight: () => 600 } },
                addImage: vi.fn(),
                setFont: vi.fn(),
                setFontSize: vi.fn(),
                setTextColor: vi.fn(),
                setFillColor: vi.fn(),
                setDrawColor: vi.fn(),
                roundedRect: vi.fn(),
                text: vi.fn(),
                addFileToVFS: vi.fn(),
                addFont: vi.fn(),
                save: vi.fn(),
                lastAutoTable: { finalY: 100 },
            };
            pdfMock(doc);
            return doc;
        }),
    };
});
vi.mock('jspdf-autotable', () => ({ default: autoTableMock }));

import { exportPortfolioExcel, exportPortfolioPdf, loadLogoDataUrl } from './portfolioExport';

// Yeni sectioned giriş: { sections, summary: { cards, hasReal }, meta }
const spotSection = (showReal = false) => ({
    key: 'SPOT', label: 'Spot', count: 1, isFixed: false, showReal,
    headers: { asset: 'Varlık', type: 'Tip', qty: 'Adet', avg: 'Ort. Maliyet', cur: 'Anlık Fiyat', value: 'Toplam Değer', pnl: 'K/Z', realPnl: 'Reel K/Z' },
    rows: [
        { asset: 'BTC', type: 'Kripto', qty: '1', avg: '$50.000,00', cur: '$60.000,00', value: '₺60.000,00',
          pnl: '+₺10.000,00', pnlPct: '+20,00%', pnlPositive: true,
          realPnl: showReal ? '+₺9.000,00' : '—', realPct: showReal ? '+18,00%' : '', realPositive: true },
    ],
});

const baseMeta = (showReal = false) => ({
    title: 'Portföy', subtitle: 'altbaşlık', date: '2026-06-01', dateLabel: 'Tarih',
    fileBase: 'portfoy_2026', footer: 'FP', showReal,
});

const baseSummary = (hasReal = false) => ({
    hasReal,
    cards: [
        { label: 'Maliyet', value: '₺50.000,00' },
        { label: 'Değer', value: '₺60.000,00' },
        { label: 'K/Z', value: '+₺10.000,00', positive: true },
        { label: 'Getiri', value: '+20,00%', positive: true },
        ...(hasReal ? [{ label: 'Reel K/Z', value: '+₺9.000,00', positive: true, sub: '+18,00% (Enflasyon ~×1,10)' }] : []),
    ],
});

const baseData = (real = false) => ({
    meta: baseMeta(real), summary: baseSummary(real), sections: [spotSection(real)],
});

beforeEach(() => {
    Object.values(xlsxMock.utils).forEach(fn => fn.mockClear());
    xlsxMock.writeFile.mockClear();
    autoTableMock.mockClear();
});

describe('exportPortfolioExcel', () => {
    it('aoa_to_sheet çağrılır + writeFile filename', () => {
        exportPortfolioExcel(baseData());
        expect(xlsxMock.utils.aoa_to_sheet).toHaveBeenCalled();
        expect(xlsxMock.writeFile).toHaveBeenCalledWith(expect.anything(), 'portfoy_2026.xlsx');
    });

    it('özet kartlar + bölüm başlık/satırları aoa içinde', () => {
        exportPortfolioExcel(baseData());
        const aoa = xlsxMock.utils.aoa_to_sheet.mock.calls[0][0];
        expect(aoa.some(row => row[0] === 'Maliyet')).toBe(true);          // özet kart
        expect(aoa.some(row => row[0] === 'Spot · 1')).toBe(true);          // bölüm başlığı
        expect(aoa.some(row => row[0] === 'BTC')).toBe(true);               // veri satırı
    });

    it('showReal → Reel K/Z + % kolonları eklenir (10 sütun)', () => {
        exportPortfolioExcel(baseData(true));
        const aoa = xlsxMock.utils.aoa_to_sheet.mock.calls[0][0];
        const header = aoa.find(row => row[0] === 'Varlık');
        expect(header).toHaveLength(10);
        expect(header).toContain('Reel K/Z');
    });

    it('book_append_sheet "Portföy" sheet name', () => {
        exportPortfolioExcel(baseData());
        expect(xlsxMock.utils.book_append_sheet).toHaveBeenCalledWith(expect.anything(), expect.anything(), 'Portföy');
    });
});

describe('exportPortfolioPdf', () => {
    it('her bölüm için autoTable + doc.save filename', async () => {
        let docRef;
        pdfMock.mockImplementationOnce((doc) => { docRef = doc; });
        const data = baseData();
        data.sections = [spotSection(), { ...spotSection(), key: 'FIXED', label: 'Sabit Getiri' }];
        await exportPortfolioPdf(data, null);
        expect(autoTableMock).toHaveBeenCalledTimes(2); // 2 bölüm → 2 tablo
        expect(docRef.save).toHaveBeenCalledWith('portfoy_2026.pdf');
    });

    it('özet kartları + bölüm başlıkları için roundedRect/text çağrılır', async () => {
        let docRef;
        pdfMock.mockImplementationOnce((doc) => { docRef = doc; });
        await exportPortfolioPdf(baseData(), null);
        expect(docRef.roundedRect).toHaveBeenCalled();          // özet kart kutuları
        expect(docRef.text.mock.calls.length).toBeGreaterThan(6);
    });

    it('logoDataUrl yoksa addImage çağrılmaz', async () => {
        let docRef;
        pdfMock.mockImplementationOnce((doc) => { docRef = doc; });
        await exportPortfolioPdf(baseData(), null);
        expect(docRef.addImage).not.toHaveBeenCalled();
    });

    it('logoDataUrl varsa addImage çağrılır', async () => {
        let docRef;
        pdfMock.mockImplementationOnce((doc) => { docRef = doc; });
        await exportPortfolioPdf(baseData(), 'data:image/png;base64,xxx');
        expect(docRef.addImage).toHaveBeenCalled();
    });
});

describe('loadLogoDataUrl', () => {
    it('fetch başarısız → null döner', async () => {
        globalThis.fetch = vi.fn(() => Promise.reject(new Error('fail')));
        const url = await loadLogoDataUrl();
        expect(url).toBeNull();
    });

    it('fetch + blob + FileReader → dataURL döner', async () => {
        const fakeBlob = new Blob(['x'], { type: 'image/png' });
        globalThis.fetch = vi.fn(() => Promise.resolve({ blob: () => Promise.resolve(fakeBlob) }));
        const OriginalReader = globalThis.FileReader;
        globalThis.FileReader = class {
            constructor() {
                this.result = 'data:image/png;base64,ABC';
            }
            readAsDataURL() {
                setTimeout(() => this.onloadend(), 0);
            }
        };
        const url = await loadLogoDataUrl();
        expect(url).toBe('data:image/png;base64,ABC');
        globalThis.FileReader = OriginalReader;
    });
});
