import { useState, useCallback, useRef } from 'react';

/**
 * Chart üzerine çizim araçlarını yönetir (çizgi, dikdörtgen, metin, ok, cetvel).
 *
 * Çizilen her overlay bir ref Map'inde (id → {name, points, extendData}) tutulur; böylece
 * "Grafik Kaydet" için snapshot alınabilir ve kaydedilmiş bir grafik açılınca geri yüklenebilir.
 */
export const useChartOverlays = (chartInstance) => {
    const [editingText, setEditingText] = useState(null);
    const overlaysRef = useRef(new Map()); // id -> { name, points, extendData }

    // klinecharts event'inden gelen overlay'i snapshot Map'ine yaz
    const record = useCallback((overlay) => {
        if (!overlay?.id) return;
        overlaysRef.current.set(overlay.id, {
            name: overlay.name,
            points: overlay.points,
            extendData: overlay.extendData ?? null,
        });
    }, []);

    const baseCallbacks = useCallback(() => ({
        onDrawEnd: (e) => { record(e.overlay); return false; },
        onPressedMoveEnd: (e) => { record(e.overlay); return false; },
        onRemoved: (e) => { if (e?.overlay?.id) overlaysRef.current.delete(e.overlay.id); return false; },
    }), [record]);

    const createOverlay = useCallback((name) => {
        if (!chartInstance.current) return;

        if (name === 'customText') {
            chartInstance.current.createOverlay({
                name: 'customText',
                ...baseCallbacks(),
                onDrawEnd: (e) => {
                    record(e.overlay);
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
                    return false;
                }
            });
        } else {
            chartInstance.current.createOverlay({ name, ...baseCallbacks() });
        }
    }, [chartInstance, baseCallbacks, record]);

    const removeAllOverlays = useCallback(() => {
        if (chartInstance.current) {
            chartInstance.current.removeOverlay();
        }
        overlaysRef.current.clear();
    }, [chartInstance]);

    const updateTextOverlay = useCallback((text) => {
        if (chartInstance.current && editingText) {
            const value = text || "Metin";
            chartInstance.current.overrideOverlay({ id: editingText.id, extendData: value });
            // snapshot'taki extendData'yı da güncelle
            const snap = overlaysRef.current.get(editingText.id);
            if (snap) overlaysRef.current.set(editingText.id, { ...snap, extendData: value });
            setEditingText(null);
        }
    }, [chartInstance, editingText]);

    /** Kaydetmek için çizimlerin serileştirilebilir kopyası. */
    const getOverlaysSnapshot = useCallback(
        () => Array.from(overlaysRef.current.values()).map(o => ({
            name: o.name,
            points: o.points,
            extendData: o.extendData ?? null,
        })),
        []
    );

    /** Kaydedilmiş çizimleri grafiğe geri yükler (data uygulandıktan sonra çağrılmalı). */
    const restoreOverlays = useCallback((list) => {
        if (!chartInstance.current || !Array.isArray(list)) return;
        list.forEach(o => {
            if (!o?.name || !Array.isArray(o.points)) return;
            const id = chartInstance.current.createOverlay({
                name: o.name,
                points: o.points,
                extendData: o.extendData ?? null,
                ...baseCallbacks(),
            });
            if (id) overlaysRef.current.set(id, { name: o.name, points: o.points, extendData: o.extendData ?? null });
        });
    }, [chartInstance, baseCallbacks]);

    return {
        editingText,
        setEditingText,
        createOverlay,
        removeAllOverlays,
        updateTextOverlay,
        getOverlaysSnapshot,
        restoreOverlays,
    };
};
