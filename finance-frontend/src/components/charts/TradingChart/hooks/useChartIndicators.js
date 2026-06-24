import { useState, useCallback } from 'react';

export const useChartIndicators = (chartInstance) => {
    const [activeIndicators, setActiveIndicators] = useState([]);

    const toggleIndicator = useCallback((ind) => {
        if (!chartInstance.current) return;
        
        const paneId = ['MA', 'BOLL'].includes(ind) ? 'candle_pane' : `pane_${ind}`;
        
        setActiveIndicators((prev) => {
            if (prev.includes(ind)) {
                chartInstance.current.removeIndicator(paneId, ind);
                return prev.filter(i => i !== ind);
            } else {
                chartInstance.current.createIndicator(ind, false, { id: paneId });
                return [...prev, ind];
            }
        });
    }, [chartInstance]);

    return { activeIndicators, toggleIndicator };
};
