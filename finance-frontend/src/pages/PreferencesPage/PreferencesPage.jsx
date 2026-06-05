import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Settings, Save, Loader2, BarChart3, Eye, Home, ShieldCheck, ShieldOff, Mail, MailX } from 'lucide-react';
import { preferencesApi } from '../../services/api/preferencesApi';
import { aggregateApi } from '../../services/api/aggregateApi';
import { userApi } from '../../services/api/userApi';
import TickerPicker from '../../components/preferences/TickerPicker';
import { useNotify } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

/**
 * Aggregate market response'unu TickerPicker'ın beklediği pools formatına çevirir.
 * Her item: { symbol, name? }. Symbol normalize edilir: currencies'te currencyCode, diğerlerinde symbol.
 */
function buildPools(all) {
    if (!all) return { STOCK: [], CRYPTO: [], CURRENCY: [], COMMODITY: [], BOND: [], FUND: [] };

    const normalizeStock = (i) => ({ symbol: i.symbol, name: i.name });
    const normalizeCurrency = (i) => ({ symbol: i.currencyCode || i.symbol, name: i.currencyName || i.name });
    const normalizeCrypto = (i) => ({ symbol: i.currencyCode || i.symbol, name: i.currencyName || i.name });
    const normalizeCommodity = (i) => ({ symbol: i.symbol, name: i.name });
    const normalizeBond = (i) => ({ symbol: i.symbol || i.code, name: i.name });
    const normalizeFund = (i) => ({ symbol: i.symbol || i.code, name: i.name });

    const dedupe = (arr) => {
        const seen = new Set();
        const out = [];
        for (const x of arr) {
            if (!x.symbol) continue;
            if (seen.has(x.symbol)) continue;
            seen.add(x.symbol);
            out.push(x);
        }
        return out;
    };

    return {
        STOCK: dedupe([...(all.indices || []), ...(all.stocks || [])].map(normalizeStock)),
        CRYPTO: dedupe((all.cryptos || []).map(normalizeCrypto)),
        CURRENCY: dedupe((all.currencies || []).map(normalizeCurrency)),
        COMMODITY: dedupe([...(all.commodities || []), ...(all.turkish_gold || [])].map(normalizeCommodity)),
        BOND: dedupe([...(all.global_bonds || []), ...(all.tr_bonds || []), ...(all.eurobonds || [])].map(normalizeBond)),
        FUND: dedupe([...(all.tr_funds || []), ...(all.global_funds || [])].map(normalizeFund))
    };
}

export default function PreferencesPage() {
    const { t } = useTranslation(['preferences', 'common']);
    const queryClient = useQueryClient();
    const notify = useNotify();
    const { isAdmin } = useAuth();

    const [tickers, setTickers] = useState([]);
    const [scope, setScope] = useState('ALL_PAGES');
    const [dirty, setDirty] = useState(false);

    // 2FA durumu — Keycloak'tan canlı çekilir
    const { data: twoFaStatus, isLoading: twoFaLoading } = useQuery({
        queryKey: ['user-2fa-status'],
        queryFn: userApi.get2FAStatus,
        staleTime: 30_000
    });
    const twoFaEnabled = !!twoFaStatus?.enabled;

    const toggle2FaMutation = useMutation({
        mutationFn: (enabled) => userApi.set2FA(enabled),
        onSuccess: (res, enabled) => {
            queryClient.invalidateQueries({ queryKey: ['user-2fa-status'] });
            notify({
                type: enabled ? 'success' : 'warning',
                title: enabled
                    ? t('preferences:security.enabledTitle', '2FA etkinleştirildi')
                    : t('preferences:security.disabledTitle', '2FA devre dışı'),
                message: res?.message || ''
            });
        },
        onError: (err) => {
            notify({
                type: 'error',
                title: t('preferences:security.error', '2FA değiştirilemedi'),
                message: err?.response?.data?.message || ''
            });
        }
    });

    // E-posta bildirimleri durumu
    const { data: emailNotifStatus, isLoading: emailNotifLoading } = useQuery({
        queryKey: ['user-email-notifications'],
        queryFn: userApi.getEmailNotifications,
        staleTime: 30_000
    });
    const emailNotifEnabled = !!emailNotifStatus?.enabled;

    const toggleEmailMutation = useMutation({
        mutationFn: (enabled) => userApi.setEmailNotifications(enabled),
        onSuccess: (res, enabled) => {
            queryClient.invalidateQueries({ queryKey: ['user-email-notifications'] });
            notify({
                type: enabled ? 'success' : 'warning',
                title: enabled
                    ? t('preferences:notifications.enabledTitle', 'E-posta bildirimleri açık')
                    : t('preferences:notifications.disabledTitle', 'E-posta bildirimleri kapalı'),
            });
        },
        onError: (err) => {
            notify({
                type: 'error',
                title: t('preferences:notifications.error', 'Bildirim ayarı değiştirilemedi'),
                message: err?.response?.data?.message || ''
            });
        }
    });

    // Mevcut tercihler
    const { data: prefs, isLoading: prefsLoading } = useQuery({
        queryKey: ['user-preferences'],
        queryFn: preferencesApi.getMyPreferences
    });

    // Asset pool — tüm market verileri
    const { data: allMarkets, isLoading: marketsLoading } = useQuery({
        queryKey: ['preferences-all-markets'],
        queryFn: aggregateApi.getAllMarkets,
        staleTime: 60_000
    });

    // İlk yüklemede backend'den gelen tercihleri lokal state'e yansıt
    useEffect(() => {
        if (prefs) {
            setTickers(prefs.tickers || []);
            setScope(prefs.tickerScope || 'ALL_PAGES');
            setDirty(false);
        }
    }, [prefs]);

    const pools = useMemo(() => buildPools(allMarkets), [allMarkets]);

    const saveMutation = useMutation({
        mutationFn: preferencesApi.updateMyPreferences,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
            queryClient.invalidateQueries({ queryKey: ['tickerData'] });
            setDirty(false);
        }
    });

    const handleTickersChange = (next) => {
        setTickers(next);
        setDirty(true);
    };

    const handleScopeChange = (next) => {
        setScope(next);
        setDirty(true);
    };

    const handleSave = () => {
        saveMutation.mutate({ tickers, tickerScope: scope });
    };

    const loading = prefsLoading || marketsLoading;

    return (
        <div className="min-h-screen bg-bg p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                        <Settings size={20} />
                    </div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">{t('preferences:pageTitle', 'Tercihler')}</h1>
                </div>
                <p className="text-text-muted mb-8 text-sm sm:text-base">
                    {t('preferences:pageSubtitle', 'Uygulama deneyimini kişiselleştir.')}
                </p>

                {loading ? (
                    <div className="flex items-center justify-center py-20 text-text-muted">
                        <Loader2 className="animate-spin mr-3" size={24} />
                        <span>{t('common:status.loading')}</span>
                    </div>
                ) : (
                    <>
                        {/* Section: Ticker Listesi */}
                        <section className="bg-surface-2 border border-border rounded-2xl p-4 md:p-6 mb-6">
                            <div className="flex items-center gap-2 mb-1">
                                <BarChart3 size={18} className="text-primary" />
                                <h2 className="text-lg sm:text-xl font-bold">
                                    {t('preferences:ticker.title', 'Market Ticker Listesi')}
                                </h2>
                            </div>
                            <p className="text-xs sm:text-sm text-text-muted mb-4">
                                {t('preferences:ticker.subtitle', 'Üst banttaki kayan ticker barında hangi varlıkların görüneceğini seç.')}
                            </p>

                            <TickerPicker
                                pools={pools}
                                selected={tickers}
                                onChange={handleTickersChange}
                                maxCount={20}
                            />
                        </section>

                        {/* Section: Görünürlük */}
                        <section className="bg-surface-2 border border-border rounded-2xl p-4 md:p-6 mb-6">
                            <div className="flex items-center gap-2 mb-1">
                                <Eye size={18} className="text-primary" />
                                <h2 className="text-lg sm:text-xl font-bold">
                                    {t('preferences:scope.title', 'Ticker Bar Görünürlüğü')}
                                </h2>
                            </div>
                            <p className="text-xs sm:text-sm text-text-muted mb-4">
                                {t('preferences:scope.subtitle', 'Ticker bar hangi sayfalarda görünsün?')}
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <ScopeOption
                                    value="ALL_PAGES"
                                    active={scope === 'ALL_PAGES'}
                                    onSelect={handleScopeChange}
                                    icon={Eye}
                                    title={t('preferences:scope.allPages', 'Tüm Sayfalarda Göster')}
                                    desc={t('preferences:scope.allPagesDesc', 'Hangi sayfada olursan ol, ticker bar üstte sticky görünür.')}
                                />
                                <ScopeOption
                                    value="HOME_ONLY"
                                    active={scope === 'HOME_ONLY'}
                                    onSelect={handleScopeChange}
                                    icon={Home}
                                    title={t('preferences:scope.homeOnly', 'Yalnızca Ana Sayfada')}
                                    desc={t('preferences:scope.homeOnlyDesc', 'Ticker bar sadece dashboard (ana sayfa) açıkken görünür.')}
                                />
                            </div>
                        </section>

                        {/* Section: Güvenlik (2FA) — admin için gizli (admin login akışında 2FA zorunlu değil) */}
                        {!isAdmin && (
                        <section className="bg-surface-2 border border-border rounded-2xl p-4 md:p-6 mb-6">
                            <div className="flex items-center gap-2 mb-1">
                                {twoFaEnabled
                                    ? <ShieldCheck size={18} className="text-buy" />
                                    : <ShieldOff size={18} className="text-warning" />
                                }
                                <h2 className="text-lg sm:text-xl font-bold">
                                    {t('preferences:security.title', 'Güvenlik')}
                                </h2>
                            </div>
                            <p className="text-xs sm:text-sm text-text-muted mb-4">
                                {t('preferences:security.subtitle', 'İki adımlı doğrulama (2FA) ayarları.')}
                            </p>

                            <div className="flex items-center justify-between gap-4 bg-surface border border-border rounded-xl p-4">
                                <div className="min-w-0">
                                    <div className="font-semibold text-sm">
                                        {t('preferences:security.twoFactor', 'İki Adımlı Doğrulama (2FA)')}
                                    </div>
                                    <div className="text-xs text-text-muted mt-0.5">
                                        {twoFaLoading
                                            ? t('common:status.loading')
                                            : twoFaEnabled
                                                ? t('preferences:security.enabledDesc', 'Aktif — girişte ek doğrulama kodu istenir.')
                                                : t('preferences:security.disabledDesc', 'Devre dışı — sadece şifre ile giriş yapılır.')
                                        }
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={twoFaEnabled}
                                    disabled={twoFaLoading || toggle2FaMutation.isPending}
                                    onClick={() => toggle2FaMutation.mutate(!twoFaEnabled)}
                                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                                        twoFaEnabled ? 'bg-buy' : 'bg-surface-hover'
                                    }`}
                                    title={twoFaEnabled
                                        ? t('preferences:security.disable', 'Devre dışı bırak')
                                        : t('preferences:security.enable', 'Etkinleştir')}
                                >
                                    {toggle2FaMutation.isPending ? (
                                        <Loader2 className="animate-spin absolute inset-0 m-auto text-text" size={14} />
                                    ) : (
                                        <span
                                            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition-transform ${
                                                twoFaEnabled ? 'translate-x-5' : 'translate-x-0'
                                            }`}
                                        />
                                    )}
                                </button>
                            </div>

                            {twoFaEnabled
                                ? null
                                : (
                                    <p className="text-[11px] text-text-muted mt-3 italic">
                                        {t('preferences:security.enableHint', 'Etkinleştirdikten sonra bir sonraki girişte Authenticator uygulamasıyla kurulum istenir.')}
                                    </p>
                                )
                            }
                        </section>
                        )}

                        {/* Section: Bildirimler (E-posta) */}
                        <section className="bg-surface-2 border border-border rounded-2xl p-4 md:p-6 mb-6">
                            <div className="flex items-center gap-2 mb-1">
                                {emailNotifEnabled
                                    ? <Mail size={18} className="text-buy" />
                                    : <MailX size={18} className="text-warning" />}
                                <h2 className="text-lg sm:text-xl font-bold">
                                    {t('preferences:notifications.title', 'Bildirimler')}
                                </h2>
                            </div>
                            <p className="text-xs sm:text-sm text-text-muted mb-4">
                                {t('preferences:notifications.subtitle', 'Fiyat alarmları tetiklendiğinde e-posta bildirimi alın.')}
                            </p>

                            <div className="flex items-center justify-between gap-4 bg-surface border border-border rounded-xl p-4">
                                <div className="min-w-0">
                                    <div className="font-semibold text-sm">
                                        {t('preferences:notifications.emailAlarm', 'Alarm E-posta Bildirimleri')}
                                    </div>
                                    <div className="text-xs text-text-muted mt-0.5">
                                        {emailNotifLoading
                                            ? t('common:status.loading')
                                            : emailNotifEnabled
                                                ? t('preferences:notifications.emailEnabledDesc', 'Aktif — fiyat alarmları tetiklendiğinde kayıtlı e-postanıza bildirim gider.')
                                                : t('preferences:notifications.emailDisabledDesc', 'Devre dışı — alarm tetiklense de e-posta gönderilmez.')
                                        }
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={emailNotifEnabled}
                                    disabled={emailNotifLoading || toggleEmailMutation.isPending}
                                    onClick={() => toggleEmailMutation.mutate(!emailNotifEnabled)}
                                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                                        emailNotifEnabled ? 'bg-buy' : 'bg-surface-hover'
                                    }`}
                                >
                                    {toggleEmailMutation.isPending ? (
                                        <Loader2 className="animate-spin absolute inset-0 m-auto text-text" size={14} />
                                    ) : (
                                        <span
                                            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition-transform ${
                                                emailNotifEnabled ? 'translate-x-5' : 'translate-x-0'
                                            }`}
                                        />
                                    )}
                                </button>
                            </div>
                        </section>

                        {/* Save button */}
                        <div className="flex items-center justify-end gap-3 sticky bottom-4 bg-bg/95 backdrop-blur p-3 rounded-xl border border-border z-10">
                            {saveMutation.isSuccess && !dirty && (
                                <span className="text-xs text-buy font-semibold">
                                    {t('preferences:saved', 'Kaydedildi')}
                                </span>
                            )}
                            {saveMutation.isError && (
                                <span className="text-xs text-sell font-semibold">
                                    {t('preferences:saveError', 'Kaydedilemedi')}
                                </span>
                            )}
                            <button
                                onClick={handleSave}
                                disabled={!dirty || saveMutation.isPending}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-primary-fg rounded-lg font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition"
                            >
                                {saveMutation.isPending ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                                {t('common:actions.save', 'Kaydet')}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function ScopeOption({ value, active, onSelect, icon: Icon, title, desc }) {
    return (
        <button
            type="button"
            onClick={() => onSelect(value)}
            className={`text-left p-4 rounded-xl border-2 transition flex gap-3 ${
                active
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-surface hover:border-border-strong'
            }`}
        >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                active ? 'bg-primary text-primary-fg' : 'bg-bg text-text-muted'
            }`}>
                <Icon size={18} />
            </div>
            <div className="min-w-0">
                <div className="font-semibold text-sm">{title}</div>
                <div className="text-xs text-text-muted mt-0.5">{desc}</div>
            </div>
        </button>
    );
}
