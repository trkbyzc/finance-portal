import { useState, useCallback } from 'react';

/**
 * ✏️ Chart Overlays Hook
 * Chart üzerine çizim araçlarını yönetir (çizgi, fibonacci, metin, vb.)
 * 
 * @param {React.RefObject} chartInstance - Chart instance ref
 * @returns {Object} { editingText, setEditingText, createOverlay, removeAllOverlays, updateTextOverlay }
 */
export const useChartOverlays = (chartInstance) => {
    const [editingText, setEditingText] = useState(null);

    const createOverlay = useCallback((name) => {
        if (!chartInstance.current) return;

        if (name === 'customText') {
            chartInstance.current.createOverlay({
                name: 'customText',
                onDrawEnd: (e) => {
                    const coord = chartInstance.current.convertToPixel(
                        e.overlay.points[0], 
                        { id: 'candle_pane' }
                    );
                    setEditingText({ 
                        id: e.overlay.id, 
                        text: '', 
                        x: coord.x, 
                        y: Math.max(coord.y, 20) 
                    });
                }
            });
        } else {
            chartInstance.current.createOverlay({ name });
        }
    }, [chartInstance]);

    const removeAllOverlays = useCallback(() => {
        if (chartInstance.current) {
            chartInstance.current.removeOverlay();
        }
    }, [chartInstance]);

    const updateTextOverlay = useCallback((text) => {
        if (chartInstance.current && editingText) {
            chartInstance.current.overrideOverlay({ 
                id: editingText.id, 
                extendData: text || "Metin" 
            });
            setEditingText(null);
        }
    }, [chartInstance, editingText]);

    return { 
        editingText, 
        setEditingText, 
        createOverlay, 
        removeAllOverlays, 
        updateTextOverlay 
    };
};
