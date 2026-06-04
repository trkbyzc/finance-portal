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
            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors max-w-[140px] ${
                isAsset
                    ? 'text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20'
                    : 'text-text-muted bg-surface-2 border border-border hover:text-text hover:border-border-strong'
            } ${className}`}
        >
            {isAsset ? <TrendingUp size={11} className="shrink-0" /> : null}
            <span className="truncate">{link.label}</span>
            <ArrowUpRight size={11} className="shrink-0 opacity-70" />
        </button>
    );
}
