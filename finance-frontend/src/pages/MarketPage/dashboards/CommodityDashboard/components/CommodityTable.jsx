import { useNavigate } from 'react-router-dom';
import {
    ChevronRight,
    Droplets,
    Flame,
    Wheat,
    Coins,
    Gem,
    Hammer,
    Construction
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '../../../../../utils/formatters/numberFormatter';

const getCommodityIcon = (code) => {
    const c = code.toUpperCase();
    if (c.includes('CL')) return <Droplets className="text-blue-400" size={20} />;
    if (c.includes('GC') || c.includes('GA')) return <Coins className="text-primary" size={20} />;
    if (c.includes('SI') || c.includes('GAG')) return <Gem className="text-gray-400" size={20} />;
    if (c.includes('NG')) return <Flame className="text-orange-500" size={20} />;
    if (c.includes('ZW') || c.includes('ZC')) return <Wheat className="text-yellow-600" size={20} />;
    if (c.includes('HG')) return <Hammer className="text-orange-700" size={20} />;
    return <Construction className="text-gray-500" size={20} />;
};

export default function CommodityTable({ data, loading }) {
    const navigate = useNavigate();
    const { t } = useTranslation(['markets', 'common']);
    if (loading) return <div className="h-96 animate-pulse bg-surface border border-border rounded-2xl"></div>;

    return (
        <div className="bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-border bg-surface-2/50 flex items-center gap-3">
                <Coins className="text-primary" size={20} />
                <h2 className="text-lg font-bold text-text tracking-tight">{t('markets:commodity.headerTitle')}</h2>
            </div>
            <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-surface-2 sticky top-0 z-10 shadow-md">
                    <tr>
                        <th className="p-5 text-xs font-bold text-text-muted uppercase tracking-wider">{t('common:labels.asset')}</th>
                        <th className="p-5 text-xs font-bold text-text-muted uppercase tracking-wider text-right">{t('common:labels.buyRate')}</th>
                        <th className="p-5 text-xs font-bold text-text-muted uppercase tracking-wider text-right">{t('common:labels.sellRate')}</th>
                        <th className="p-5"></th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2e39]">
                    {data && data.length > 0 ? (
                        data.map((item, index) => {
                            const code = item?.currencyCode || item?.symbol || "";
                            const name = item?.currencyName || item?.name || code;
                            const buying = item?.forexBuying || item?.price || 0;
                            const selling = item?.forexSelling || item?.price || 0;

                            return (
                                <tr
                                    key={`${code}-${index}`}
                                    onClick={() => code && navigate(`/chart/${encodeURIComponent(code)}?cat=COMMODITY`)}
                                    className="hover:bg-surface-2 transition cursor-pointer group"
                                >
                                    <td className="p-5 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-surface-2 border border-border flex items-center justify-center shadow-inner group-hover:border-primary transition-all">
                                            {getCommodityIcon(code)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-text group-hover:text-text transition line-clamp-1">
                                                {name.split(',')[0]}
                                            </div>
                                            <div className="text-[10px] text-text-muted uppercase font-mono">{code}</div>
                                        </div>
                                    </td>
                                    <td className="p-5 text-right font-mono font-bold text-text-muted">
                                        ₺{formatNumber(buying)}
                                    </td>
                                    <td className="p-5 text-right font-mono font-bold text-text group-hover:text-primary">
                                        ₺{formatNumber(selling)}
                                    </td>
                                    <td className="p-5 text-right text-text-muted group-hover:text-primary">
                                        <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan="4" className="p-10 text-center text-text-muted">{t('markets:common.noResults')}</td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
