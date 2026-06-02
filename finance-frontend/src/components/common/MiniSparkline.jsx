import React, { useRef, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { historicalApi } from '../../services/api';

/**
 * 1 aylık günlük close fiyatı çizgi grafiği — Top movers/Volume/VIOP listelerinde mini chart.
 *
 * Reusable: TR Stocks, VIOP ve gerekli her sayfada kullan. Asset category prop'u
 * backend chart strategy chain'ini doğru route etmek için kritik (VIOP=VIOP, hisse=STOCK).
 *
 * Performance — LAZY:
 *   - Veri çekme ve recharts render'ı yalnızca satır ekrana girince başlar (IntersectionObserver).
 *     VIOP gibi 100+ satırlı listelerde aksi halde mount anında yüzlerce istek + chart aynı anda
 *     açılıp tarayıcıyı saniyelerce kilitliyordu. Artık sadece görünen ~10-15 satır yüklenir.
 *   - Tek useQuery per symbol — TanStack cache, staleTime 5dk
 *   - dot=false + isAnimationActive=false — çok hücrede render edildiği için kritik
 *
 * Hata/boş data durumunda sessizce boş div döner (kart yüksekliği korunur).
 */
export default function MiniSparkline({ symbol, color, category = 'STOCK', width = 80, height = 30 }) {
    const containerRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isVisible) return; // bir kez görünür olunca observer'a gerek yok
        const el = containerRef.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            // 150px önden tetikle — kullanıcı satıra ulaşmadan grafik hazır olsun
            { rootMargin: '150px' }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [isVisible]);

    const { data } = useQuery({
        queryKey: ['mini-sparkline', category, symbol],
        queryFn: async () => {
            const res = await historicalApi.getData({
                symbol, category, range: '1mo', interval: '1d'
            });
            const arr = Array.isArray(res) ? res : (res?.priceData || res || []);
            return arr
                .map(p => ({ value: Number(p.close ?? p.price ?? 0) }))
                .filter(p => p.value > 0);
        },
        staleTime: 5 * 60 * 1000,
        enabled: !!symbol && isVisible
    });

    return (
        <div ref={containerRef} style={{ width, height }}>
            {isVisible && data && data.length >= 2 && (
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke={color}
                            strokeWidth={1.5}
                            dot={false}
                            isAnimationActive={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}
