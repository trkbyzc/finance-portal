import { useState, useMemo, useCallback } from 'react';
import { Eye, EyeOff, FileSpreadsheet, FileText, Plus, Wallet } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../../context/CurrencyContext';
import { useNotify } from '../../context/NotificationContext';
import { nativeCurrencyForType } from '../../utils/currencyConversion';
import { displaySymbol } from '../../utils/symbolDisplay';
import { exportPortfolioExcel, exportPortfolioPdf, loadLogoDataUrl } from '../../utils/portfolioExport';
import { portfolioApi } from '../../services/api/portfolioApi';
import { economyApi } from '../../services/api';
import AddToPortfolioModal from '../../components/portfolio/AddToPortfolioModal';
import BuyMoreModal from '../../components/portfolio/BuyMoreModal';
import SellModal from '../../components/portfolio/SellModal';
import PortfolioStats from '../../components/portfolio/PortfolioStats';
import PortfolioCharts from '../../components/portfolio/PortfolioCharts';
import PortfolioTabs from '../../components/portfolio/PortfolioTabs';
import TransactionHistoryModal from '../../components/portfolio/TransactionHistoryModal';
import HoldingsTable from '../../components/portfolio/HoldingsTable';
import PortfolioActivityCharts from '../../components/portfolio/charts/PortfolioActivityCharts';
import PnlHistoryWidget from '../../components/portfolio/charts/PnlHistoryWidget';
import PortfolioRiskAnalytics from '../../components/portfolio/PortfolioRiskAnalytics';
import PortfolioSwitcher from '../../components/portfolio/PortfolioSwitcher';
import usePortfolioPricing from './hooks/usePortfolioPricing';
import usePortfolioTabs from './hooks/usePortfolioTabs';
import { assetNature, NATURE_ORDER } from '../../utils/assetNature';

/**
 * Portföy sayfası — orchestrator.
 *
 * Fiyat hesaplama + tab filtreleme custom hook'lara çıkarıldı:
 *   - usePortfolioPricing: marketData + fundPrices query'leri, getCurrentPrice ve calculateProfitLoss
 *   - usePortfolioTabs:    aktif tab + filteredPortfolio + tabs/counts
 *
 * Sayfa kalan parçaları yönetir: ekle/al/sat/geçmiş modal'ları + render düzeni.
 */
const PortfolioPage = () => {
    const { t } = useTranslation(['portfolio', 'common']);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [buyMoreAsset, setBuyMoreAsset] = useState(null);
    const [sellAsset, setSellAsset] = useState(null);
    const [historySymbol, setHistorySymbol] = useState(null);
    const queryClient = useQueryClient();
    const { currency, toggleCurrency, formatPrice } = useCurrency();
    const notify = useNotify();

    // Bakiye gizleme (göz ikonu) — localStorage'da kalıcı
    const [hideBalances, setHideBalances] = useState(() => localStorage.getItem('hideBalances') === '1');
    const toggleHide = () => setHideBalances(v => {
        const next = !v;
        localStorage.setItem('hideBalances', next ? '1' : '0');
        return next;
    });

    // Çoklu adlandırılmış portföy
    const [selectedPortfolioId, setSelectedPortfolioId] = useState(null);
    const { data: portfolios = [] } = useQuery({
        queryKey: ['portfolios'],
        queryFn: portfolioApi.getPortfolios
    });
    const activePortfolioId = useMemo(
        () => (selectedPortfolioId && portfolios.some(p => p.id === selectedPortfolioId))
            ? selectedPortfolioId
            : (portfolios[0]?.id ?? null),
        [selectedPortfolioId, portfolios]
    );

    const { data: portfolio, isLoading, error } = useQuery({
        queryKey: ['portfolio', activePortfolioId],
        queryFn: () => portfolioApi.getMyPortfolio(activePortfolioId)
    });

    const createPortfolioMutation = useMutation({
        mutationFn: portfolioApi.createPortfolio,
        onSuccess: (res, name) => {
            queryClient.invalidateQueries({ queryKey: ['portfolios'] });
            if (res?.id) setSelectedPortfolioId(res.id);
            notify({ type: 'success', title: t('portfolio:notify.created', 'Portföy oluşturuldu'), message: typeof name === 'string' ? name : '' });
        }
    });
    const renamePortfolioMutation = useMutation({
        mutationFn: ({ id, name }) => portfolioApi.renamePortfolio(id, name),
        onSuccess: (res, vars) => {
            queryClient.invalidateQueries({ queryKey: ['portfolios'] });
            notify({ type: 'info', title: t('portfolio:notify.renamed', 'Portföy yeniden adlandırıldı'), message: vars?.name || '' });
        }
    });
    const deletePortfolioMutation = useMutation({
        mutationFn: portfolioApi.deletePortfolio,
        onSuccess: () => {
            setSelectedPortfolioId(null);
            queryClient.invalidateQueries({ queryKey: ['portfolios'] });
            queryClient.invalidateQueries({ queryKey: ['portfolio'] });
            notify({ type: 'warning', title: t('portfolio:notify.deleted', 'Portföy silindi') });
        }
    });

    const { getCurrentPrice, getDailyChange, calculateProfitLoss } = usePortfolioPricing(portfolio);
    const { activeTab, setActiveTab, tabsState, filteredPortfolio } = usePortfolioTabs(portfolio);

    // Reel (enflasyon-düzeltilmiş) getiri için: en erken alış tarihi (işlemler) + CPI endeksi (EVDS)
    const { data: txPage } = useQuery({
        queryKey: ['portfolio-tx-all'],
        queryFn: () => portfolioApi.getTransactions({ size: 500 }),
        enabled: !!portfolio && portfolio.length > 0
    });
    const { data: cpiSeries } = useQuery({
        queryKey: ['cpi-cumulative-10y'],
        queryFn: () => economyApi.getCumulativeInflation('10y'),
        staleTime: 60 * 60 * 1000
    });

    // CPI serisini bir kez sırala (artan tarih). Reel K/Z faktörleri bunun üstünden hesaplanır.
    const cpiSorted = useMemo(() => {
        const cpi = Array.isArray(cpiSeries) ? cpiSeries : (cpiSeries?.content || []);
        return cpi.filter(p => p?.date && p?.value != null).sort((a, b) => (a.date < b.date ? -1 : 1));
    }, [cpiSeries]);

    // Bir alış tarihi (YYYY-MM-DD…) için enflasyon faktörü = CPI_bugün / CPI_o_ay.
    const factorForDate = useCallback((dateStr) => {
        if (!cpiSorted.length || !dateStr) return null;
        const cpiNow = Number(cpiSorted[cpiSorted.length - 1].value);
        const targetMonth = String(dateStr).slice(0, 7); // YYYY-MM
        let cpiThen = null;
        for (const p of cpiSorted) { if (p.date.slice(0, 7) <= targetMonth) cpiThen = Number(p.value); else break; }
        if (cpiThen == null) cpiThen = Number(cpiSorted[0].value);
        if (!cpiNow || !cpiThen) return null;
        return cpiNow / cpiThen;
    }, [cpiSorted]);

    // Her varlık (symbol) için KENDİ en eski BUY tarihinin enflasyon faktörü → { 'THYAO.IS': 4.19, ... }.
    // Reel K/Z'yi varlık bazında düzeltir; üst kartlardaki ortalama da bundan türetilir.
    const inflationFactorBySymbol = useMemo(() => {
        const txs = txPage?.content || (Array.isArray(txPage) ? txPage : []);
        if (!cpiSorted.length || !txs.length) return null;
        const earliestBySymbol = {};
        for (const tx of txs) {
            if (tx.side !== 'BUY' || !tx.executedAt || !tx.symbol) continue;
            const cur = earliestBySymbol[tx.symbol];
            if (!cur || tx.executedAt < cur) earliestBySymbol[tx.symbol] = tx.executedAt;
        }
        const map = {};
        for (const [sym, date] of Object.entries(earliestBySymbol)) {
            const f = factorForDate(date);
            if (f != null) map[sym] = f;
        }
        return Object.keys(map).length ? map : null;
    }, [txPage, cpiSorted, factorForDate]);

    // Excel / PDF dışa aktarma — aktif sekmedeki holding'leri sisteme uygun belgeye döker
    const buildExportData = () => {
        const list = filteredPortfolio || [];

        // Ekrandaki formatlayıcılar (PortfolioStats / HoldingsTable ile birebir): birim fiyatlar
        // varlığın KENDİ para biriminde; toplam değer / K-Z TRY bazlı; tahvil kotasyonu para değil.
        const moneyTRY = (v) => formatPrice(v, 'TRY', 2, 2);
        const moneyNative = (v, nat) => formatPrice(v, nat);
        const signedTRY = (v) => `${v >= 0 ? '+' : '-'}${formatPrice(Math.abs(v), 'TRY', 2, 2)}`;
        const pctStr = (v) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;

        // --- Üst özet kartlar (PortfolioStats ile aynı hesap) ---
        const totalCost = list.reduce((s, i) => s + (calculateProfitLoss(i).costValue || 0), 0);
        const totalValue = list.reduce((s, i) => s + (calculateProfitLoss(i).currentValue || 0), 0);
        const totalPnl = totalValue - totalCost;
        const returnRate = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
        const pnlUp = totalPnl >= 0;
        const hasReal = inflationFactorBySymbol != null && totalCost > 0;
        const realCost = hasReal
            ? list.reduce((s, i) => s + (calculateProfitLoss(i).costValue || 0) * (inflationFactorBySymbol[i.symbol] || 1), 0)
            : null;
        const avgFactor = hasReal && totalCost > 0 ? realCost / totalCost : null;
        const realIsFlat = hasReal && avgFactor <= 1.005;
        const realPnl = hasReal ? totalValue - realCost : null;
        const realReturnRate = hasReal && realCost > 0 ? (realPnl / realCost) * 100 : null;
        const realUp = hasReal && realPnl >= 0;

        const cards = [
            { label: t('portfolio:stats.totalCost'), value: moneyTRY(totalCost) },
            { label: t('portfolio:stats.totalValue'), value: moneyTRY(totalValue) },
            { label: t('portfolio:stats.totalPnl'), value: signedTRY(totalPnl), positive: pnlUp },
            { label: t('portfolio:stats.totalPnlPercent'), value: pctStr(returnRate), positive: pnlUp },
        ];
        if (hasReal) {
            const note = realIsFlat
                ? `(${t('portfolio:stats.recentBuy', 'yakın tarihli alım')})`
                : `(${t('portfolio:stats.inflation', 'Enflasyon')} ~×${avgFactor.toFixed(2)})`;
            cards.push({
                label: `${t('portfolio:stats.realPnl', 'Reel')} K/Z`,
                value: signedTRY(realPnl),
                positive: realUp,
                sub: `${pctStr(realReturnRate)} ${note}`,
            });
        }

        // --- Satır kurucu (HoldingRow ile birebir: rozetler, kotasyon, çarpan, reel K/Z) ---
        const buildRow = (item) => {
            const calc = calculateProfitLoss(item);
            const native = nativeCurrencyForType(item.assetType, item.symbol);
            const isBond = item.assetType === 'BOND';
            const isDibs = isBond && String(item.symbol || '').startsWith('TP.');
            const isViop = item.assetType === 'FUTURE';
            const isShort = String(item.direction || '').toUpperCase() === 'SHORT';
            const leverage = Number(item.leverage) || 0;
            const multiplier = Number(item.contractSize) || 1;
            const showMultiplier = isViop && multiplier > 1;
            const tipLabel = isDibs ? 'DİBS'
                : (isBond && !String(item.symbol || '').startsWith('^')) ? 'Eurobond'
                : t('common:assetTypes.' + item.assetType, item.assetType);
            const quoteFmt = (v) => { const n = Number(v) || 0; return isDibs ? `%${n.toFixed(2)}` : n.toFixed(2); };
            // Varlık etiketi: sembol + (VİOP yön/kaldıraç rozeti) + (günlük değişim %)
            const dcRaw = getDailyChange ? getDailyChange(item.symbol, item.assetType) : null;
            const dc = (dcRaw != null && !Number.isNaN(Number(dcRaw))) ? Number(dcRaw) : null;
            let asset = displaySymbol(item.symbol);
            if (isViop && item.direction) asset += `  ${isShort ? 'SHORT' : 'LONG'}${leverage > 0 ? ` ${leverage.toFixed(0)}×` : ''}`;
            if (dc != null) asset += `  (${dc >= 0 ? '+' : ''}${dc.toFixed(2)}%)`;
            // Reel K/Z (per satır) — maliyet varlığın kendi alış tarihi faktörüyle bugünkü liraya.
            const f = inflationFactorBySymbol?.[item.symbol];
            const hasRealRow = f != null && f > 0 && (calc.costValue || 0) > 0;
            const realCostRow = hasRealRow ? (calc.costValue || 0) * f : null;
            const realPnlRow = hasRealRow ? (calc.currentValue || 0) - realCostRow : null;
            const realPctRow = hasRealRow && realCostRow > 0 ? (realPnlRow / realCostRow) * 100 : null;
            return {
                asset,
                type: tipLabel,
                qty: `${item.quantity}${showMultiplier ? ` × ${multiplier}` : ''}`,
                avg: isBond ? quoteFmt(item.averagePrice) : moneyNative(item.averagePrice, native),
                cur: isBond ? quoteFmt(calc.currentPrice) : moneyNative(calc.currentPrice, native),
                value: moneyTRY(calc.currentValue),
                pnl: signedTRY(calc.profitLoss),
                pnlPct: pctStr(calc.profitLossPercent),
                pnlPositive: calc.profitLoss >= 0,
                realPnl: realPnlRow == null ? '—' : signedTRY(realPnlRow),
                realPct: realPctRow == null ? '' : pctStr(realPctRow),
                realPositive: realPnlRow != null && realPnlRow >= 0,
            };
        };

        // --- Doğa bazlı bölümler (HoldingsTable kolon başlıklarıyla; FIXED dinamik başlık) ---
        const sections = NATURE_ORDER
            .filter((nat) => list.some((i) => assetNature(i.assetType) === nat))
            .map((nat) => {
                const items = list.filter((i) => assetNature(i.assetType) === nat);
                const isFixed = nat === 'FIXED';
                const allDibs = isFixed && items.every((it) => String(it.symbol || '').startsWith('TP.'));
                const allEuro = isFixed && items.every((it) => it.assetType === 'BOND' && !String(it.symbol || '').startsWith('TP.') && !String(it.symbol || '').startsWith('^'));
                const qtyLabel = isFixed ? t('portfolio:holdings.cols.nominal', 'Nominal') : t('portfolio:holdings.cols.quantity');
                const avgLabel = !isFixed ? t('portfolio:holdings.cols.avgPrice')
                    : allEuro ? t('portfolio:holdings.cols.entryCleanPrice', 'Giriş Temiz Fiyatı')
                    : allDibs ? t('portfolio:holdings.cols.entryYield', 'Giriş Getirisi')
                    : t('portfolio:holdings.cols.entryQuote', 'Giriş Değeri');
                const curLabel = !isFixed ? t('portfolio:holdings.cols.currentPrice')
                    : allEuro ? t('portfolio:holdings.cols.currentCleanPrice', 'Güncel Temiz Fiyat')
                    : allDibs ? t('portfolio:holdings.cols.currentYield', 'Güncel Getiri')
                    : t('portfolio:holdings.cols.currentQuote', 'Güncel Değer');
                const label = nat === 'SPOT' ? t('portfolio:nature.spot', 'Spot')
                    : nat === 'FIXED' ? t('portfolio:nature.fixed', 'Sabit Getiri')
                    : t('portfolio:nature.deriv', 'Türev (VİOP)');
                return {
                    key: nat, label, count: items.length, isFixed, showReal: hasReal,
                    headers: {
                        asset: t('portfolio:holdings.cols.asset'),
                        type: t('common:labels.type'),
                        qty: qtyLabel, avg: avgLabel, cur: curLabel,
                        value: t('portfolio:holdings.cols.totalValue'),
                        pnl: t('portfolio:holdings.cols.pnl'),
                        realPnl: t('portfolio:holdings.cols.realPnl', 'Reel K/Z'),
                    },
                    rows: items.map(buildRow),
                };
            });

        const meta = {
            title: t('portfolio:pageTitle'),
            subtitle: t('portfolio:export.subtitle'),
            date: new Date().toLocaleDateString('tr-TR'),
            dateLabel: t('common:labels.date'),
            fileBase: `finansportal-portfoy-${new Date().toISOString().slice(0, 10)}`,
            footer: 'FinansPortal',
            showReal: hasReal,
        };
        return { sections, summary: { cards, hasReal }, meta };
    };

    const onExportExcel = () => {
        const data = buildExportData();
        if (data.sections.length) exportPortfolioExcel(data);
    };
    const onExportPdf = async () => {
        const data = buildExportData();
        if (!data.sections.length) return;
        const logo = await loadLogoDataUrl();
        await exportPortfolioPdf(data, logo);
    };

    const addAssetMutation = useMutation({
        // Hedef portföy modal'dan gelebilir (portföy seçici); yoksa aktif portföy.
        mutationFn: (data) => portfolioApi.addManualEntry({ ...data, portfolioId: data.portfolioId || activePortfolioId }),
        onSuccess: (res, vars) => {
            queryClient.invalidateQueries({ queryKey: ['portfolio'] });
            queryClient.invalidateQueries({ queryKey: ['portfolios'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['portfolio-tx-all'] }); // reel K/Z enflasyon faktörü bu liste üstünden hesaplanır
            const pid = vars?.portfolioId || activePortfolioId;
            const pname = portfolios.find(p => p.id === pid)?.name;
            const buildMsg = () => {
                if (!vars?.symbol) return '';
                return pname
                    ? t('portfolio:notify.assetAddedToMsg', '{{symbol}} → {{portfolio}} portföyüne eklendi.', { symbol: vars.symbol, portfolio: pname })
                    : t('portfolio:notify.assetAddedMsg', '{{symbol}} portföyünüze eklendi.', { symbol: vars.symbol });
            };
            notify({
                type: 'success',
                title: t('portfolio:notify.assetAdded', 'Portföye eklendi'),
                message: buildMsg()
            });
        },
        onError: (err) => notify({
            type: 'error',
            title: t('portfolio:notify.assetAddError', 'Eklenemedi'),
            message: err?.response?.data?.message || err?.message || ''
        })
    });

    const sellAssetMutation = useMutation({
        mutationFn: (data) => portfolioApi.removeFromPortfolio({ ...data, portfolioId: activePortfolioId }),
        onSuccess: (res, vars) => {
            queryClient.invalidateQueries({ queryKey: ['portfolio'] });
            queryClient.invalidateQueries({ queryKey: ['portfolios'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['portfolio-tx-all'] }); // reel K/Z enflasyon faktörü bu liste üstünden hesaplanır
            notify({
                type: 'info',
                title: t('portfolio:notify.assetSold', 'Satış kaydedildi'),
                message: vars?.symbol ? t('portfolio:notify.assetSoldMsg', '{{symbol}} pozisyonu güncellendi.', { symbol: vars.symbol }) : ''
            });
        }
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-bg flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-text-muted">{t('common:status.loading')}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-bg flex items-center justify-center">
                <div className="text-center text-red-500">
                    <p>{t('common:status.error')}</p>
                    <p className="text-sm text-text-muted mt-2">{error.message}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg p-4 md:p-6">
            <div className="max-w-container mx-auto">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
                    <div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-2xl sm:text-3xl font-bold">{t('portfolio:pageTitle')}</h1>
                            {portfolios.length > 0 && (
                                <PortfolioSwitcher
                                    portfolios={portfolios}
                                    activeId={activePortfolioId}
                                    onSelect={setSelectedPortfolioId}
                                    onCreate={(name) => createPortfolioMutation.mutate(name)}
                                    onRename={(id, name) => renamePortfolioMutation.mutate({ id, name })}
                                    onDelete={(id) => deletePortfolioMutation.mutate(id)}
                                />
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        {/* Bakiye gizle/göster */}
                        <button
                            onClick={toggleHide}
                            title={hideBalances ? t('portfolio:showBalances', 'Bakiyeleri göster') : t('portfolio:hideBalances', 'Bakiyeleri gizle')}
                            className="w-11 h-11 flex items-center justify-center rounded-lg bg-surface-2 hover:bg-surface-hover border border-border text-text-muted hover:text-text transition"
                        >
                            {hideBalances ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                        {/* TRY / USD */}
                        <button
                            onClick={toggleCurrency}
                            title={t('asset:showInCurrency', 'Para birimi')}
                            className="h-11 px-3 flex items-center gap-1 rounded-lg bg-surface-2 hover:bg-surface-hover border border-border text-sm font-bold transition"
                        >
                            <span className={currency === 'TRY' ? 'text-primary' : 'text-text-muted'}>₺</span>
                            <span className="text-text-muted">/</span>
                            <span className={currency === 'USD' ? 'text-primary' : 'text-text-muted'}>$</span>
                        </button>
                        {/* Excel / PDF dışa aktarma */}
                        <button
                            onClick={onExportExcel}
                            title={t('portfolio:export.excel', 'Excel indir')}
                            className="w-11 h-11 flex items-center justify-center rounded-lg bg-surface-2 hover:bg-surface-hover border border-border text-buy transition"
                        >
                            <FileSpreadsheet size={20} />
                        </button>
                        <button
                            onClick={onExportPdf}
                            title={t('portfolio:export.pdf', 'PDF indir')}
                            className="w-11 h-11 flex items-center justify-center rounded-lg bg-surface-2 hover:bg-surface-hover border border-border text-sell transition"
                        >
                            <FileText size={20} />
                        </button>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-primary hover:bg-primary-hover text-primary-fg rounded-xl font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all flex items-center gap-1.5"
                        >
                            <Plus size={18} /> {t('common:actions.add')}
                        </button>
                    </div>
                </div>

                {portfolio && portfolio.length > 0 && tabsState.tabs.length > 1 && (
                    <PortfolioTabs
                        tabs={tabsState.tabs}
                        counts={tabsState.counts}
                        activeTab={activeTab}
                        onChange={setActiveTab}
                    />
                )}

                <PortfolioStats
                    portfolio={filteredPortfolio}
                    calculateProfitLoss={calculateProfitLoss}
                    hidden={hideBalances}
                    inflationFactorBySymbol={inflationFactorBySymbol}
                />

                {filteredPortfolio && filteredPortfolio.length > 0 && (
                    <div className={hideBalances ? 'blur-md select-none pointer-events-none transition' : 'transition'}>
                        <PortfolioCharts
                            portfolio={filteredPortfolio}
                            calculateProfitLoss={calculateProfitLoss}
                            groupBy={activeTab === 'ALL' ? 'assetType' : 'symbol'}
                            parentAssetType={activeTab === 'ALL' ? null : activeTab}
                        />
                    </div>
                )}

                {portfolio?.length === 0 ? (
                    /* Hiç varlık yok — ilk varlık için ortada geniş mavi CTA */
                    <div className="bg-surface-2 border border-border rounded-2xl p-10 sm:p-16 text-center flex flex-col items-center">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
                            <Wallet size={30} className="text-primary" />
                        </div>
                        <h3 className="text-xl font-bold text-text mb-2">{t('portfolio:holdings.noHoldings')}</h3>
                        <p className="text-text-muted text-sm mb-6 max-w-sm">{t('portfolio:pageSubtitle')}</p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="w-full max-w-sm px-6 py-4 bg-primary hover:bg-primary-hover text-primary-fg rounded-xl font-bold text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
                        >
                            <Plus size={20} /> {t('portfolio:holdings.addFirst')}
                        </button>
                    </div>
                ) : activeTab === 'ALL' ? (
                    // Tümü: varlık doğasına göre gruplanmış bölümler (her biri kendi sütun başlıklarıyla)
                    NATURE_ORDER
                        .filter((nat) => (portfolio || []).some((i) => assetNature(i.assetType) === nat))
                        .map((nat, _i, arr) => {
                            const list = (filteredPortfolio || []).filter((i) => assetNature(i.assetType) === nat);
                            const label = nat === 'SPOT' ? t('portfolio:nature.spot', 'Spot')
                                : nat === 'FIXED' ? t('portfolio:nature.fixed', 'Sabit Getiri')
                                : t('portfolio:nature.deriv', 'Türev (VİOP)');
                            return (
                                <div key={nat} className="mb-5">
                                    {arr.length > 1 && (
                                        <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 mt-1">
                                            {label} <span className="opacity-60">· {list.length}</span>
                                        </h3>
                                    )}
                                    <HoldingsTable
                                        portfolio={list}
                                        calculateProfitLoss={calculateProfitLoss}
                                        getDailyChange={getDailyChange}
                                        inflationFactorBySymbol={inflationFactorBySymbol}
                                        hidden={hideBalances}
                                        nature={nat}
                                        onOpenHistory={setHistorySymbol}
                                        onOpenBuy={setBuyMoreAsset}
                                        onOpenSell={setSellAsset}
                                    />
                                </div>
                            );
                        })
                ) : (
                    <HoldingsTable
                        portfolio={filteredPortfolio}
                        calculateProfitLoss={calculateProfitLoss}
                        getDailyChange={getDailyChange}
                        inflationFactorBySymbol={inflationFactorBySymbol}
                        hidden={hideBalances}
                        nature={activeTab}
                        onOpenHistory={setHistorySymbol}
                        onOpenBuy={setBuyMoreAsset}
                        onOpenSell={setSellAsset}
                    />
                )}

                {/* Varlık listesinin altında: Maliyet/Piyasa Değeri + Günlük Durum çubuk grafikleri */}
                {filteredPortfolio && filteredPortfolio.length > 0 && (
                    <div className={hideBalances ? 'blur-md select-none pointer-events-none transition' : 'transition'}>
                        <PortfolioActivityCharts
                            portfolio={filteredPortfolio}
                            calculateProfitLoss={calculateProfitLoss}
                            getDailyChange={getDailyChange}
                        />
                    </div>
                )}

                {/* K/Z Grafikleri — varlık seç, zaman içindeki kâr/zararını gör */}
                {filteredPortfolio && filteredPortfolio.length > 0 && (
                    <div className={hideBalances ? 'blur-md select-none pointer-events-none transition' : 'transition'}>
                        <PnlHistoryWidget
                            portfolio={filteredPortfolio}
                            calculateProfitLoss={calculateProfitLoss}
                        />
                    </div>
                )}

                {/* Risk & Çeşitlendirme — yalnızca "Tümü" sekmesinde (tüm portföy bazında anlamlı) */}
                {activeTab === 'ALL' && portfolio && portfolio.length > 0 && (
                    <PortfolioRiskAnalytics
                        portfolio={portfolio}
                        calculateProfitLoss={calculateProfitLoss}
                        hidden={hideBalances}
                    />
                )}
            </div>

            <AddToPortfolioModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={(data) => addAssetMutation.mutateAsync(data)}
                portfolios={portfolios}
                activePortfolioId={activePortfolioId}
            />

            <BuyMoreModal
                isOpen={!!buyMoreAsset}
                onClose={() => setBuyMoreAsset(null)}
                onSubmit={(data) => addAssetMutation.mutateAsync(data)}
                asset={buyMoreAsset}
                currentPrice={buyMoreAsset ? getCurrentPrice(buyMoreAsset.symbol, buyMoreAsset.assetType) : null}
            />

            <SellModal
                isOpen={!!sellAsset}
                onClose={() => setSellAsset(null)}
                onSubmit={(data) => sellAssetMutation.mutateAsync(data)}
                asset={sellAsset}
                currentPrice={sellAsset ? getCurrentPrice(sellAsset.symbol, sellAsset.assetType) : null}
            />

            <TransactionHistoryModal
                isOpen={!!historySymbol}
                onClose={() => setHistorySymbol(null)}
                symbol={historySymbol}
            />
        </div>
    );
};

export default PortfolioPage;
