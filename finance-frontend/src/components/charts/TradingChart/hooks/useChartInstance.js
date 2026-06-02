import { useEffect, useRef } from 'react';
import { init, dispose } from 'klinecharts';
import { getChartStyles } from '../utils/chartConfig';
import { formatKlineDate } from '../../../../utils/formatters/dateFormatter';

/**
 * 🎨 Chart Instance Hook
 * KlineCharts instance'ını yönetir
 * 
 * @param {React.RefObject} containerRef - Chart container ref
 * @param {string} chartType - Chart tipi (candle_solid, area, vb.)
 * @param {boolean} isLineChart - Line chart mı?
 * @param {boolean} isNone - Chart yok mu?
 * @returns {React.RefObject} Chart instance ref
 */
export const useChartInstance = (containerRef, chartType, isLineChart, isNone) => {
    const chartInstance = useRef(null);

    useEffect(() => {
        if (isLineChart || isNone || !containerRef.current) {
            // Line chart veya None ise klinecharts kullanma
            if (chartInstance.current) {
                dispose(containerRef.current);
                chartInstance.current = null;
            }
            return;
        }

        // Önceki instance'ı temizle
        if (chartInstance.current) {
            dispose(containerRef.current);
            chartInstance.current = null;
        }

        // Yeni instance oluştur — tarihler Türk usulü GG.AA.YYYY (eksen + crosshair tooltip)
        const chart = init(containerRef.current, {
            customApi: {
                formatDate: (_dateTimeFormat, timestamp, format) => formatKlineDate(timestamp, format)
            }
        });
        chart.setStyles(getChartStyles(chartType));
        chart.createIndicator('VOL', false, { id: 'pane_VOL', height: 100 });
        chartInstance.current = chart;

        // Resize handler
        const handleResize = () => {
            if (chartInstance.current) {
                chartInstance.current.resize();
            }
        };
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            if (containerRef.current && chartInstance.current) {
                dispose(containerRef.current);
                chartInstance.current = null;
            }
        };
    }, [isLineChart, isNone, chartType]);

    return chartInstance;
};
