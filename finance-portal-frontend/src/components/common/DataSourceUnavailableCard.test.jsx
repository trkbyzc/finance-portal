import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import tr from '../../i18n/locales/tr/common.json';
import en from '../../i18n/locales/en/common.json';

// Gerçek i18next davranışını taklit eder: anahtar sözlükte varsa çevirisini,
// yoksa verilen defaultValue'yu döner. Basit `(k, fb) => fb ?? k` taklidi burada
// YETMEZ, çünkü bileşen t(key, { defaultValue: '' }) biçiminde çağırıyor.
const langRef = { current: 'tr' };
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key, opts) => {
            const dict = langRef.current === 'en' ? enDict : trDict;
            const value = key.split('.').reduce((acc, part) => acc?.[part], dict);
            if (typeof value === 'string') return value;
            if (typeof opts === 'string') return opts;
            return opts?.defaultValue ?? key;
        },
        i18n: { language: langRef.current }
    })
}));

const trDict = tr;
const enDict = en;

const { default: DataSourceUnavailableCard } = await import('./DataSourceUnavailableCard');

const hata = (over = {}) => ({
    source: 'news-content',
    reason: 'DISABLED',
    // Backend BU METNİ gönderiyor — her zaman Türkçe, dilden bağımsız.
    message: 'Haber başlıkları RSS ile gelir ve kaynağına yönlendirir.',
    requiresAuth: false,
    ...over
});

describe('DataSourceUnavailableCard', () => {
    it('İngilizcede backend’in Türkçe mesajını DEĞİL, İngilizce çeviriyi gösterir', () => {
        langRef.current = 'en';
        render(<DataSourceUnavailableCard error={hata()} />);

        expect(screen.getByText(en.dataSource.notes['news-content'])).toBeInTheDocument();
        expect(screen.queryByText(/Haber başlıkları RSS ile gelir/)).not.toBeInTheDocument();
    });

    it('Türkçede kaynağa özel Türkçe metni gösterir', () => {
        langRef.current = 'tr';
        render(<DataSourceUnavailableCard error={hata()} />);

        expect(screen.getByText(tr.dataSource.notes['news-content'])).toBeInTheDocument();
    });

    it('çevirisi olmayan yeni bir kaynakta backend mesajına düşer', () => {
        langRef.current = 'en';
        render(<DataSourceUnavailableCard error={hata({ source: 'henuz-cevrilmemis' })} />);

        expect(screen.getByText(/Haber başlıkları RSS ile gelir/)).toBeInTheDocument();
    });

    it('hata yoksa hiçbir şey çizmez', () => {
        const { container } = render(<DataSourceUnavailableCard error={null} />);
        expect(container).toBeEmptyDOMElement();
    });
});

describe('çeviri dosyaları', () => {
    it('iki dilde de AYNI kaynak listesi bulunur', () => {
        // Asıl hata buydu: metin bir dilde yazılıp diğerinde unutulmuştu.
        expect(Object.keys(en.dataSource.notes).sort())
            .toEqual(Object.keys(tr.dataSource.notes).sort());
    });

    it('hiçbir not boş bırakılmamıştır', () => {
        for (const [dil, sozluk] of [['tr', tr], ['en', en]]) {
            for (const [kaynak, metin] of Object.entries(sozluk.dataSource.notes)) {
                expect(metin.trim().length, `${dil}/${kaynak} boş`).toBeGreaterThan(20);
            }
        }
    });
});
