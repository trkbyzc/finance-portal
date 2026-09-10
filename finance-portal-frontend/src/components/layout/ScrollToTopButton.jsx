import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Sayfa kaydırıldıkça sol altta beliren "Başa Dön" butonu. 300px sonra fade-in,
 * tıklanınca smooth scroll. ChatWidget sağ altta olduğu için bu sol altta durur.
 */
export default function ScrollToTopButton() {
    const { t } = useTranslation('common');
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const onScroll = () => setVisible(globalThis.scrollY > 300);
        globalThis.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        return () => globalThis.removeEventListener('scroll', onScroll);
    }, []);

    const handleClick = () => {
        globalThis.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            aria-label={t('actions.scrollToTop', 'Başa Dön')}
            title={t('actions.scrollToTop', 'Başa Dön')}
            className={`fixed bottom-6 left-6 z-90 w-12 h-12 rounded-full bg-primary text-primary-fg shadow-2xl border border-primary/30
                flex items-center justify-center transition-all duration-200 hover:scale-110 hover:bg-primary-hover
                ${visible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        >
            <ArrowUp size={22} strokeWidth={2.5} />
        </button>
    );
}
