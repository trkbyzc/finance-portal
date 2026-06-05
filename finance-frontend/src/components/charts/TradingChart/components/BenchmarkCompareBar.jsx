import { useTranslation } from 'react-i18next';

/**
 * Generic benchmark karşılaştırma toggle bar — BIST endeksleri için ve kripto için de
 * aynı görsel dilde. Aktif buton kendi rengiyle dolgulu, pasif outline.
 *
 * @param {string} labelKey i18n key (örn. 'charts:bistCompare', 'charts:cryptoCompare')
 * @param {string} activeLabelKey aktif olduğunda gösterilen italik mesaj key'i
 * @param {Array} options [{ key, label, color }]
 * @param {Object} activeMap { key: bool }
 * @param {Function} onToggle (key) => void
 * @param {string} [buttonColor] Verilirse: PASİF butonlar nötr/siyah, AKTİF buton bu renkle
 *   (lacivert) dolgulu olur. Grafik çizgileri yine kendi `b.color`'ını kullanır.
 *   Verilmezse eski davranış: pasif = kendi renginde outline.
 */
export default function BenchmarkCompareBar({ labelKey, activeLabelKey, options, activeMap, onToggle, buttonColor, extra }) {
    const { t } = useTranslation('charts');
    const hasActive = Object.values(activeMap).some(Boolean);

    return (
        <div className="h-11 bg-surface border-b border-border flex items-center px-4 gap-2 shrink-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted mr-2">
                {t(labelKey)}
            </span>
            {options.map(b => {
                const active = activeMap[b.key];
                const c = buttonColor || b.color;
                // buttonColor varsa: pasif nötr/siyah; yoksa pasif kendi renginde outline
                const passiveClass = buttonColor
                    ? 'bg-surface-2 text-text border-border hover:border-border-strong'
                    : 'bg-surface-2 hover:bg-surface-hover';
                const passiveStyle = buttonColor ? undefined : { color: c, borderColor: `${c}66` };
                return (
                    <button
                        key={b.key}
                        onClick={() => onToggle(b.key)}
                        className={`px-3 py-1 text-xs font-bold rounded-md border transition-all ${
                            active ? 'text-text shadow-lg' : passiveClass
                        }`}
                        style={active
                            ? { backgroundColor: c, borderColor: c, boxShadow: `0 0 12px ${c}55` }
                            : passiveStyle
                        }
                    >
                        {b.label}
                    </button>
                );
            })}
            {extra}
            {hasActive && (
                <span className="ml-auto text-[10px] text-text-muted italic">
                    {t(activeLabelKey)}
                </span>
            )}
        </div>
    );
}
