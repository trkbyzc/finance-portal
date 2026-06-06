import { useState, useCallback } from 'react';

/**
 * 📊 Chart Indicators Hook
 * Chart indicator'larını yönetir (MA, BOLL, RSI, vb.)
 * 
 * @param {React.RefObject} chartInstance - Chart instance ref
 * @returns {Object} { activeIndicators, toggleIndicator }
 */
export const useChartIndicators = (chartInstance) => {
    const [activeIndicators, setActiveIndicators] = useState([]);

    const toggleIndicator = useCallback((ind) => {
        if (!chartInstance.current) return;
        
        const paneId = ['MA', 'BOLL'].includes(ind) ? 'candle_pane' : `pane_${ind}`;
        
        setActiveIndicators((prev) => {
            if (prev.includes(ind)) {
                // Indicator'ı kaldır
                chartInstance.current.removeIndicator(paneId, ind);
                return prev.filter(i => i !== ind);
            } else {
                // Indicator'ı ekle
                chartInstance.current.createIndicator(ind, false, { id: paneId });
                return [...prev, ind];
            }
        });
    }, [chartInstance]);

    return { activeIndicators, toggleIndicator };
};
