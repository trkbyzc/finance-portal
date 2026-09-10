import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function NavActions() {
    const { t } = useTranslation('markets');
    // KOMPAKT canlı göstergesi: nokta + tek kelime ("CANLI"/"LIVE").
    // İçerik genişliği 1440px'e (max-w-container) sabitli olduğundan, eski
    // "CANLI PİYASA" iki kelimelik rozet EN modunda ve oturum kapalıyken
    // nav linklerinin üstüne biniyordu. Tek kelime + hover tooltip ile
    // dile/duruma bakmaksızın taşma olmadan sığar. 2xl altında gizli.
    return (
        <div className="relative group hidden 2xl:flex items-center shrink-0">
            <Link
                to="/markets/live"
                aria-label={`${t('ticker.live')} ${t('ticker.marketStatus')}`}
                className="flex items-center gap-1.5 bg-sell/10 text-sell px-2 py-1 rounded-md border border-sell/20 hover:bg-sell/20 transition-colors"
            >
                <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sell opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-sell"></span>
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider leading-none">{t('ticker.live')}</span>
            </Link>

            <span className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 rounded-md bg-bg-elevated text-text text-[10px] font-semibold tracking-wider whitespace-nowrap opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-150 shadow-lg border border-border z-50">
                {t('ticker.live')} {t('ticker.marketStatus')}
            </span>
        </div>
    );
}
