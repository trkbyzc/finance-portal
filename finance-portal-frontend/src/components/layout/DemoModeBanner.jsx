import { useQuery } from '@tanstack/react-query';
import { FlaskConical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../config/apiClient';

/**
 * Canlı demoda üstte görünen uyarı bandı.
 *
 * <p>Bazı sağlayıcıların kullanım şartları verilerinin yeniden sunulmasına izin
 * vermediği için canlı ortamda o kaynaklara istek atılmaz; yerine üretilmiş veri
 * gösterilir. Kullanıcının bunu <b>gerçek piyasa verisi sanmaması</b> gerekir —
 * bant tam olarak bunun için var.
 *
 * <p>Durum sunucudan okunur ({@code /meta/runtime}), arayüzde sabitlenmez: yapılandırma
 * değiştiğinde bant kendiliğinden doğru davranır. Yerel geliştirmede demo kaynak
 * olmadığı için bant hiç görünmez.
 */
export default function DemoModeBanner() {
    const { t } = useTranslation('common');

    const { data } = useQuery({
        queryKey: ['runtimeInfo'],
        queryFn: () => apiClient.get('/meta/runtime'),
        staleTime: 10 * 60 * 1000,
        retry: false
    });

    if (!data?.demoMode) return null;

    return (
        <div
            role="status"
            className="w-full bg-warning/10 border-b border-warning/25 text-warning"
        >
            <div className="max-w-container mx-auto px-3 sm:px-4 md:px-6 py-2
                            flex items-center justify-center gap-2 text-center">
                <FlaskConical size={15} className="shrink-0" />
                <p className="text-xs sm:text-sm font-medium leading-snug">
                    {t('demoBanner.text',
                        'Demo modu — bu sayfadaki hisse, fon ve vadeli verileri örnek amaçlı üretilmiştir, ' +
                        'gerçek piyasa verisi değildir. Döviz, kripto ve makro veriler gerçektir.')}
                </p>
            </div>
        </div>
    );
}
