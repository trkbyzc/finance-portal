import { useNavigate } from 'react-router-dom';
import { TrendingUp, ArrowUpRight } from 'lucide-react';
import { newsAssetLink } from '../../utils/newsAssetLink';

/**
 * Haber kartında: o haberin etkilediği varlığa (grafiğe) ya da kategorisinin piyasa sayfasına
 * götüren küçük tıklanabilir rozet. Kart tıklamasını tetiklemez (stopPropagation).
 *
 * - type 'asset'    → primary tonlu, varlık adı (örn. "Aselsan") + grafik oku.
 * - type 'category' → nötr tonlu, kategori adı.
 * Eşleşme yoksa hiçbir şey render edilmez.
 */
export default function NewsAssetChip({ item, className = '' }) {
    const navigate = useNavigate();
    const link = newsAssetLink(item);
    if (!link) return null;

    const isAsset = link.type === 'asset';

    const handleClick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        navigate(link.to);
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            title={isAsset ? link.label : undefined}
            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 sm:py-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-colors max-w-35 sm:max-w-40 min-h-7 ${
                isAsset
                    ? 'text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20'
                    : 'text-text-muted bg-surface-2 border border-border hover:text-text hover:border-border-strong'
            } ${className}`}
        >
            {isAsset ? <TrendingUp size={12} className="shrink-0" /> : null}
            <span className="truncate">{link.label}</span>
            <ArrowUpRight size={12} className="shrink-0 opacity-70" />
        </button>
    );
}
