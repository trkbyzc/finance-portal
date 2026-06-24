import { useEffect, useRef } from 'react';
import { init, dispose } from 'klinecharts';
import { getViopChartStyles } from '../utils/viopChartConfig';
import { formatKlineDate } from '../../../../utils/formatters/dateFormatter';

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

        // Re-render'da stale instance kalmaması için mount öncesi dispose edilir
        dispose(containerRef.current);

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

        return () => {
            if (chartInstance.current && containerRef.current) {
                dispose(containerRef.current);
                chartInstance.current = null;
            }
        };
    // Chart yalnızca bir kez DOM'a bağlandığında init edilir; dep array kasıtlı boş
    }, []);

    return chartInstance;
};
