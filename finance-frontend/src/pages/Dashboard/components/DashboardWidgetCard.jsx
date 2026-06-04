import { ChevronRight } from 'lucide-react';

/**
 * Giriş yapmış dashboard widget'ları için ortak kart kabuğu (başlık + bar + "Tümünü Gör").
 * Modül seviyesinde tanımlı — render içinde component oluşturmaktan kaçınmak için (state sıfırlanmasın).
 */
export default function DashboardWidgetCard({ title, viewAllLabel, onViewAll, children }) {
    return (
        <div className="bg-surface border border-border rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-text flex items-center gap-2.5">
                    <span className="w-2 h-7 bg-primary rounded-full"></span>
                    {title}
                </h2>
                {onViewAll && (
                    <button
                        onClick={onViewAll}
                        className="text-xs font-bold uppercase tracking-wider text-primary hover:text-primary-hover flex items-center gap-1"
                    >
                        {viewAllLabel} <ChevronRight size={14} />
                    </button>
                )}
            </div>
            {children}
        </div>
    );
}
