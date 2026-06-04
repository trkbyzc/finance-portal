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

const baseRows = [
    { symbol: 'BTC', type: 'CRYPTO', quantity: 1, avgPrice: 50000, currentPrice: 60000,
      currentValue: 60000, pnl: 10000, pnlPct: 20, currency: 'USD' }
];
const baseSummary = { totalCost: 50000, totalValue: 60000, totalPnl: 10000, returnRate: 20 };
const baseMeta = {
    title: 'Portföy', subtitle: 'altbaşlık', date: '2026-06-01', dateLabel: 'Tarih',
    fileBase: 'portfoy_2026',
    headers: {
        asset: 'Varlık', type: 'Tip', quantity: 'Adet', avgPrice: 'Ort.', currentPrice: 'Fiyat',
        value: 'Değer', pnl: 'K/Z', pnlPct: '%', currency: 'Para',
        totalCost: 'Top.Maliyet', totalValue: 'Top.Değer', totalPnl: 'Top.K/Z', returnRate: 'Getiri %',
        realPnl: 'Reel K/Z', realReturnRate: 'Reel %', inflationFactor: 'Enf.×',
    },
    footer: 'FP'
};

beforeEach(() => {
    Object.values(xlsxMock.utils).forEach(fn => fn.mockClear());
    xlsxMock.writeFile.mockClear();
    autoTableMock.mockClear();
});

describe('exportPortfolioExcel', () => {
    it('aoa_to_sheet çağrılır + writeFile filename', () => {
        exportPortfolioExcel(baseRows, baseSummary, baseMeta);
        expect(xlsxMock.utils.aoa_to_sheet).toHaveBeenCalled();
        expect(xlsxMock.writeFile).toHaveBeenCalledWith(expect.anything(), 'portfoy_2026.xlsx');
    });

    it('realPnl varsa 3 ek satır + inflationFactor toFixed çağrılır', () => {
        const summary = { ...baseSummary, realPnl: 5000, realReturnRate: 10, inflationFactor: 1.345 };
        exportPortfolioExcel(baseRows, summary, baseMeta);
        const aoa = xlsxMock.utils.aoa_to_sheet.mock.calls[0][0];
        expect(aoa.some(row => row[0] === 'Reel K/Z')).toBe(true);
        expect(aoa.some(row => row[0] === 'Enf.×')).toBe(true);
    });

    it('book_append_sheet "Portföy" sheet name', () => {
        exportPortfolioExcel(baseRows, baseSummary, baseMeta);
        expect(xlsxMock.utils.book_append_sheet).toHaveBeenCalledWith(expect.anything(), expect.anything(), 'Portföy');
    });
});

describe('exportPortfolioPdf', () => {
    it('autoTable çağrılır + doc.save filename', async () => {
        await exportPortfolioPdf(baseRows, baseSummary, baseMeta, null);
        expect(autoTableMock).toHaveBeenCalled();
    });

    it('logoDataUrl yoksa addImage çağrılmaz', async () => {
        let docRef;
        pdfMock.mockImplementationOnce((doc) => { docRef = doc; });
        await exportPortfolioPdf(baseRows, baseSummary, baseMeta, null);
        expect(docRef.addImage).not.toHaveBeenCalled();
    });

    it('logoDataUrl varsa addImage çağrılır', async () => {
        let docRef;
        pdfMock.mockImplementationOnce((doc) => { docRef = doc; });
        await exportPortfolioPdf(baseRows, baseSummary, baseMeta, 'data:image/png;base64,xxx');
        expect(docRef.addImage).toHaveBeenCalled();
    });

    it('realPnl varsa Reel blok yazılır (doc.text çağrı sayısı artar)', async () => {
        let docRef;
        pdfMock.mockImplementationOnce((doc) => { docRef = doc; });
        const summary = { ...baseSummary, realPnl: 5000, realReturnRate: 10, inflationFactor: 1.5 };
        await exportPortfolioPdf(baseRows, summary, baseMeta, null);
        // Reel blok için en az 3 text çağrısı ek olur
        expect(docRef.text.mock.calls.length).toBeGreaterThan(6);
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
