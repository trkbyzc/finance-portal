import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Bell, X, Loader2, ArrowUp, ArrowDown, Zap, Repeat } from 'lucide-react';
import { alarmApi } from '../../services/api/alarmApi';
import { useNotify } from '../../context/NotificationContext';

/**
 * Bir varlık için fiyat alarmı kurma modal'ı.
 *
 * Props:
 *   open: boolean
 *   onClose: () => void
 *   asset: { symbol, name, assetType, currentPrice?, currency? }
 *      assetType: backend enum (STOCK, CRYPTO, CURRENCY, COMMODITY, BOND, FUND, FUTURE, VIOP, ...)
 *
 * UI: Koşul (ABOVE / BELOW) — Değer — Sıklık (ONCE / CONTINUOUS) — Not (opsiyonel) — Oluştur
 */
export default function AlarmModal({ open, onClose, asset }) {
    const { t } = useTranslation(['alarm', 'common']);
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const notify = useNotify();

    const [condition, setCondition] = useState('ABOVE'); // ABOVE | BELOW
    const [frequency, setFrequency] = useState('ONCE'); // ONCE | CONTINUOUS
    const [threshold, setThreshold] = useState(asset?.currentPrice ? String(asset.currentPrice) : '');
    const [note, setNote] = useState('');

    const createMutation = useMutation({
        mutationFn: alarmApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-alarms'] });
            notify({
                type: 'success',
                title: t('alarm:modal.created', 'Alarm oluşturuldu'),
                message: asset?.symbol || ''
            });
            onClose?.();
        },
        onError: (err) => {
            notify({
                type: 'error',
                title: t('alarm:modal.createFailed', 'Alarm kurulamadı'),
                message: err?.response?.data?.message || ''
            });
        }
    });

    if (!open || !asset) return null;

    const canSubmit = () => {
        const v = parseFloat(threshold);
        return !isNaN(v) && v > 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!canSubmit()) return;
        createMutation.mutate({
            symbol: asset.symbol || asset.currencyCode,
            assetType: asset.assetType,
            condition,
            threshold: parseFloat(threshold),
            frequency,
            note: note.trim() || null
        });
    };

    const displayName = asset.name || asset.currencyName || asset.symbol || asset.currencyCode;

    return (
        <div
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-md p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                            <Bell size={16} />
                        </div>
                        <h2 className="text-base sm:text-lg font-bold truncate">
                            {t('alarm:modal.title', '{{name}} İçin Alarm', { name: displayName })}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 text-text-muted hover:text-text rounded transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Koşul + Değer (yan yana) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
                                {t('alarm:modal.condition', 'Koşul')}
                            </label>
                            <select
                                value={condition}
                                onChange={(e) => setCondition(e.target.value)}
                                className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:border-primary text-sm appearance-none cursor-pointer"
                            >
                                <option value="ABOVE">{t('alarm:modal.above', 'Üzerine Çıkarsa')}</option>
                                <option value="BELOW">{t('alarm:modal.below', 'Altına İnerse')}</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
                                {t('alarm:modal.value', 'Değer')}
                            </label>
                            <input
                                type="number"
                                step="0.0001"
                                min="0"
                                value={threshold}
                                onChange={(e) => setThreshold(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:border-primary text-sm font-mono"
                                required
                            />
                        </div>
                    </div>

                    {/* Sıklık — 2 segment button */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
                            {t('alarm:modal.frequency', 'Sıklık')}
                        </label>
                        <div className="grid grid-cols-2 gap-2 bg-bg border border-border rounded-lg p-1">
                            <button
                                type="button"
                                onClick={() => setFrequency('ONCE')}
                                className={`flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-semibold transition ${
                                    frequency === 'ONCE'
                                        ? 'bg-primary text-primary-fg shadow'
                                        : 'text-text-muted hover:text-text hover:bg-surface'
                                }`}
                            >
                                <Zap size={14} />
                                {t('alarm:modal.once', 'Tek Seferlik')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setFrequency('CONTINUOUS')}
                                className={`flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-semibold transition ${
                                    frequency === 'CONTINUOUS'
                                        ? 'bg-primary text-primary-fg shadow'
                                        : 'text-text-muted hover:text-text hover:bg-surface'
                                }`}
                            >
                                <Repeat size={14} />
                                {t('alarm:modal.continuous', 'Sürekli')}
                            </button>
                        </div>
                        <p className="text-[11px] text-text-muted mt-1.5">
                            {frequency === 'ONCE'
                                ? t('alarm:modal.onceHint', 'Koşul bir kez sağlandığında tetiklenir ve durur.')
                                : t('alarm:modal.continuousHint', 'Koşul her sağlandığında bildirim atar (30dk cooldown).')}
                        </p>
                    </div>

                    {/* Not */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
                            {t('alarm:modal.note', 'Not')}
                            <span className="text-text-muted/60 normal-case ml-1">({t('alarm:modal.optional', 'isteğe bağlı')})</span>
                        </label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder={t('alarm:modal.notePlaceholder', 'ör. Hedef satış fiyatım — alarm e-postasına eklenir')}
                            rows="2"
                            maxLength={500}
                            className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:border-primary text-sm resize-none"
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={!canSubmit() || createMutation.isPending}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary-hover text-primary-fg rounded-lg font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        {createMutation.isPending && <Loader2 className="animate-spin" size={16} />}
                        {condition === 'ABOVE' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                        {t('alarm:modal.create', 'Oluştur')}
                    </button>

                    <button
                        type="button"
                        onClick={() => { onClose?.(); navigate('/alarms'); }}
                        className="w-full text-center text-xs text-primary font-semibold hover:underline mt-1"
                    >
                        {t('alarm:modal.manageAlarms', 'Alarmlarımı Düzenle')}
                    </button>
                </form>
            </div>
        </div>
    );
}
