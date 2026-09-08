import { Info, Lock, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Bir veri sağlayıcısı bu ortamda sunulmadığında gösterilen bilgi kartı.
 *
 * Bilinçli olarak hata görünümünde DEĞİL: kırmızı/uyarı rengi yerine nötr yüzey
 * kullanılır, çünkü bu bir arıza değil. Kaynak ya sağlayıcının kullanım şartları
 * gereği canlı demoda kapalıdır ya da giriş gerektirir; ikisi de beklenen durumdur.
 *
 * @param {{source: string, reason: string, message: string, requiresAuth: boolean}} error
 * @param {string} [title] Bölüm adı (ör. "BİST Hisseleri") — başlıkta kullanılır.
 */
export default function DataSourceUnavailableCard({ error, title }) {
    const { t } = useTranslation('common');
    if (!error) return null;

    const needsAuth = error.requiresAuth;
    const Icon = needsAuth ? Lock : Info;

    const heading = needsAuth
        ? t('dataSource.authTitle', 'Giriş gerekiyor')
        : t('dataSource.disabledTitle', 'Bu bölüm canlı demoda kapalı');

    // Gerekçe backend'den gelir (yapılandırmadaki not); yoksa genel metne düşülür.
    const body = error.message || (needsAuth
        ? t('dataSource.authBody', 'Bu bölümü görüntülemek için giriş yapmanız gerekiyor.')
        : t('dataSource.disabledBody',
            'Bu veri, sağlayıcının kullanım şartları nedeniyle canlı demoda sunulmuyor. ' +
            'Projeyi kendi bilgisayarınızda çalıştırdığınızda bölüm tam işlevsel gelir.'));

    return (
        <div className="bg-surface-2 border border-border rounded-2xl p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-primary/10 border border-primary/20
                            flex items-center justify-center text-primary">
                <Icon size={22} />
            </div>

            <h3 className="text-lg font-bold text-text mb-2">
                {title ? `${title} — ${heading}` : heading}
            </h3>

            <p className="text-sm text-text-muted max-w-xl mx-auto leading-relaxed">
                {body}
            </p>

            {!needsAuth && (
                <a
                    href="https://github.com/trkbyzc/finance-portal#getting-started"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 mt-5 px-4 py-2 rounded-lg text-sm font-semibold
                               border border-border text-text-muted hover:text-text hover:bg-surface-hover transition"
                >
                    <ExternalLink size={15} />
                    {t('dataSource.runLocally', 'Yerelde nasıl çalıştırılır')}
                </a>
            )}
        </div>
    );
}
