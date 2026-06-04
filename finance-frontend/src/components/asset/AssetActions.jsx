import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Bell, X, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useNotify } from '../../context/NotificationContext';
import { useCurrency } from '../../context/CurrencyContext';
import { portfolioApi } from '../../services/api/portfolioApi';
import { toBackendAssetType } from '../../utils/assetTypeMapper';
import { nativeCurrencyForType } from '../../utils/currencyConversion';
import AlarmModal from '../alarm/AlarmModal';

const CUR_SYMBOL = { TRY: '₺', USD: '$' };
const YIELD_CATS = new Set(['BOND', 'TR_BOND', 'EUROBOND']);

const derivePrice = (asset) =>
    asset?.displayPrice ?? asset?.price ?? asset?.currentPrice ??
    asset?.forexSelling ?? asset?.forexBuying ?? asset?.yield ?? '';

/**
 * Bir varlık için "Portföye Ekle" + "Alarm Kur" aksiyon ikilisi.
 * AssetHeader dışındaki detay görünümlerinde (TR tahvil, küresel tahvil, TR fon — inline
 * detay panelleri) bu butonlar yoktu; ortak bileşenle hepsine ekliyoruz.
 *
 * Props:
 *   asset           — { symbol|currencyCode, name?, assetCategory?, price/displayPrice/... }
 *   assetCategory   — kategori override'ı (asset.assetCategory yoksa: 'BOND', 'TR_FUND', vb.)
 *   compact         — daha küçük buton boyutu
 */
export default function AssetActions({ asset, assetCategory, compact = false, className = '' }) {
    const { isAuthenticated } = useAuth();
    const { t } = useTranslation(['asset', 'common', 'portfolio']);
    const notify = useNotify();
    const { currency, convertPrice, toNative } = useCurrency();

    const [addOpen, setAddOpen] = useState(false);
    const [alarmOpen, setAlarmOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({ quantity: '1', price: '' });
    const [targetPortfolioId, setTargetPortfolioId] = useState('');

    const { data: portfolios = [] } = useQuery({
        queryKey: ['portfolios'],
        queryFn: portfolioApi.getPortfolios,
        enabled: isAuthenticated && addOpen
    });

    if (!isAuthenticated || !asset) return null;

    const cat = assetCategory || asset.assetCategory;
    const symbol = asset.symbol || asset.currencyCode;
    const effectiveAsset = { ...asset, assetCategory: cat, currentPrice: derivePrice(asset) };
    // Tahvil/bono getiri (%) bazlı — para birimi/çevrim uygulanmaz. Diğerlerinde native birim.
    const isYield = YIELD_CATS.has((cat || '').toUpperCase());
    const native = nativeCurrencyForType(cat, symbol);

    const openAdd = () => {
        const raw = derivePrice(asset);
        // Getiri değilse fiyatı seçili para birimine çevirip ön-doldur
        let shown = '';
        if (raw !== '') shown = isYield ? raw : convertPrice(Number(raw), native);
        const price = shown === '' ? '' : String(+Number(shown).toFixed(6));
        setForm({ quantity: '1', price });
        setTargetPortfolioId('');
        setAddOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const pid = targetPortfolioId || portfolios[0]?.id;
            await portfolioApi.addManualEntry({
                symbol,
                assetType: toBackendAssetType(cat),
                quantity: Number.parseFloat(form.quantity),
                // Getiri ise olduğu gibi; değilse girilen (seçili birim) fiyat native'e çevrilir
                averagePrice: isYield ? Number.parseFloat(form.price) : toNative(Number.parseFloat(form.price), native),
                ...(pid ? { portfolioId: pid } : {})
            });
            setAddOpen(false);
            const pname = portfolios.find(p => p.id === pid)?.name;
            notify({
                type: 'success',
                title: t('portfolio:notify.assetAdded', 'Portföye eklendi'),
                message: pname
                    ? t('portfolio:notify.assetAddedToMsg', '{{symbol}} → {{portfolio}} portföyüne eklendi.', { symbol, portfolio: pname })
                    : t('portfolio:notify.assetAddedMsg', '{{symbol}} portföyünüze eklendi.', { symbol })
            });
        } catch (error) {
            notify({
                type: 'error',
                title: t('portfolio:notify.assetAddError', 'Eklenemedi'),
                message: error.response?.data?.message || t('common:status.error')
            });
        } finally {
            setSubmitting(false);
        }
    };

    const padSize = compact ? 'px-3 py-2 text-sm' : 'px-4 py-2.5';

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <button
                onClick={openAdd}
                className={`flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-primary-fg ${padSize} rounded-xl font-bold shadow-lg shadow-primary/25 hover:scale-[1.02] transition-all whitespace-nowrap`}
            >
                <Plus size={compact ? 16 : 18} /> {t('asset:addToPortfolio', 'Portföye Ekle')}
            </button>
            <button
                onClick={() => setAlarmOpen(true)}
                title={t('asset:setAlarm', 'Fiyat alarmı kur')}
                className={`flex items-center gap-1.5 bg-surface-2 hover:bg-surface-hover border border-border hover:border-primary text-text ${padSize} rounded-xl font-bold transition-all whitespace-nowrap`}
            >
                <Bell size={compact ? 15 : 18} className="text-primary" />
                <span className="hidden sm:inline">{t('asset:setAlarm', 'Alarm Kur')}</span>
            </button>

            <AlarmModal open={alarmOpen} onClose={() => setAlarmOpen(false)} asset={effectiveAsset} />

            {addOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
                    <div className="bg-surface border border-border rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-fade-in">
                        <div className="flex justify-between items-center p-5 border-b border-border">
                            <h3 className="text-lg font-bold text-text">{t('asset:addToPortfolio', 'Portföye Ekle')}</h3>
                            <button
                                onClick={() => setAddOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text hover:bg-surface-hover transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
                            <div className="bg-surface-2 p-3 rounded-xl border border-border">
                                <div className="text-text font-bold tracking-wide">{symbol}</div>
                                <div className="text-text-muted text-[11px] truncate">{asset.name || asset.currencyName || ''}</div>
                            </div>

                            {portfolios.length > 1 && (
                                <div>
                                    <label className="block text-text-muted text-[10px] uppercase tracking-wider font-bold mb-2">{t('portfolio:modal.targetPortfolio', 'Hangi portföye?')}</label>
                                    <select
                                        value={targetPortfolioId || portfolios[0]?.id || ''}
                                        onChange={(e) => setTargetPortfolioId(e.target.value)}
                                        className="w-full bg-surface-2 border border-border rounded-lg px-4 py-3 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all appearance-none cursor-pointer"
                                    >
                                        {portfolios.map((p) => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-text-muted text-[10px] uppercase tracking-wider font-bold mb-2">{t('portfolio:modal.quantity')}</label>
                                <input
                                    type="number" step="any" required min="0.000001"
                                    value={form.quantity}
                                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                                    className="w-full bg-surface-2 border border-border rounded-lg px-4 py-3 text-text font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all"
                                    placeholder="10.5"
                                />
                            </div>

                            <div>
                                <label className="block text-text-muted text-[10px] uppercase tracking-wider font-bold mb-2">
                                    {t('portfolio:modal.purchasePrice')}{isYield ? '' : ` (${CUR_SYMBOL[currency] || currency})`}
                                </label>
                                <input
                                    type="number" step="any" required min="0.000001"
                                    value={form.price}
                                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                                    className="w-full bg-surface-2 border border-border rounded-lg px-4 py-3 text-text font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all"
                                    placeholder="150.25"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="mt-2 w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-primary-fg font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/25 flex justify-center items-center gap-2"
                            >
                                {submitting ? <Loader2 className="animate-spin" size={18} /> : t('common:actions.save')}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
