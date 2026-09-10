import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ChartStatusOverlay({ isLoading, error }) {
    const { t } = useTranslation('charts');
    if (isLoading) {
        return (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-surface/80 backdrop-blur-sm transition-opacity duration-300">
                <Loader2 size={32} className="text-primary animate-spin mb-2" />
                <span className="text-text-muted text-sm font-bold tracking-wider">{t('status.loadingChart')}</span>
            </div>
        );
    }
    if (error) {
        const errorMessage = typeof error === 'string' ? error : error?.message || t('status.errorLoading');
        return (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-surface/90 backdrop-blur-sm">
                <span className="text-sell text-sm font-bold bg-sell/10 px-6 py-3 rounded-lg border border-sell/30">
                    {errorMessage}
                </span>
            </div>
        );
    }
    return null;
}
