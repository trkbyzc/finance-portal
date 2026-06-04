import { useEffect, useRef } from 'react';
import { init, dispose } from 'klinecharts';
import { getViopChartStyles } from '../utils/viopChartConfig';
import { formatKlineDate } from '../../../../utils/formatters/dateFormatter';

/**
 * 🚀 FAZA 2: ViopTradingChart için chart instance yönetimi
 * Chart kurulumu ve temizleme işlemlerini yönetir
 */
export const useViopChartInstance = (containerRef) => {
    const chartInstance = useRef(null);

    useEffect(() => {
        console.warn('🎨 ViopChartInstance useEffect:', {
            hasContainer: !!containerRef.current,
            containerDimensions: containerRef.current ? {
                width: containerRef.current.offsetWidth,
                height: containerRef.current.offsetHeight
            } : null
        });

        if (!containerRef.current) {
            console.warn('⚠️ Container ref is null');
            return;
        }

        // Önceki instance'ı temizle
        dispose(containerRef.current);

        // Yeni chart instance oluştur
        try {
            chartInstance.current = init(containerRef.current, {
                styles: getViopChartStyles(),
                customApi: {
                    formatDate: (_dateTimeFormat, timestamp, format) => formatKlineDate(timestamp, format)
                }
            });
            console.warn('✅ ViopChart instance created successfully');
        } catch (error) {
            console.error('❌ ViopChart instance creation failed:', error);
        }

        // Cleanup
        return () => {
            console.warn('🧹 ViopChart cleanup');
            if (chartInstance.current && containerRef.current) {
                dispose(containerRef.current);
                chartInstance.current = null;
            }
        };
    }, []);

    return chartInstance;
};
