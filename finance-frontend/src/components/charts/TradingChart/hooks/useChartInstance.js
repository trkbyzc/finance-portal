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
export const useChartInstance = (containerRef, chartType, isLineChart, isNone, onCrosshairChange) => {
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
        // Volume default kapali — kullanici VOL butonuna basinca toggleIndicator() ekler.
        // Aksi takdirde alt eksen pane'i kapliyor, tarih/saat etiketleri gorunmuyor.

        // Fiyat ekseni (Y) üzerinde mouse SCROLL ile fiyat ölçeğini daralt/genişlet.
        // klinecharts Y ekseninde yalnız SÜRÜKLE-ölçekle destekler (wheel handler'ı yok).
        // Bu yüzden eksen üstünde wheel'i yakalayıp aynı sürükle-ölçekle mekanizmasını
        // sentetik mouse event'leriyle (mousedown→mousemove→mouseup) tetikliyoruz.
        chart.setPaneOptions({ id: 'candle_pane', axisOptions: { scrollZoomEnabled: true } });
        const yAxisDom = chart.getDom('candle_pane', 'yAxis');
        const onYAxisWheel = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const rect = yAxisDom.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const startY = rect.top + rect.height / 2;
            const step = Math.min(36, rect.height * 0.08);
            // Yukarı kaydır = yakınlaş (aralık daralır), aşağı = uzaklaş (aralık genişler)
            const endY = startY + (e.deltaY < 0 ? -step : step);
            const root = (yAxisDom.ownerDocument || document).documentElement;
            const mk = (type, y) => new MouseEvent(type, {
                clientX: cx, clientY: y, bubbles: true, cancelable: true, view: globalThis
            });
            const downTarget = document.elementFromPoint(cx, startY) || yAxisDom;
            downTarget.dispatchEvent(mk('mousedown', startY));
            root.dispatchEvent(mk('mousemove', endY));
            root.dispatchEvent(mk('mouseup', endY));
        };
        if (yAxisDom) {
            yAxisDom.addEventListener('wheel', onYAxisWheel, { passive: false, capture: true });
        }

        // Crosshair hareketinde üstteki OHLCV kartlarını canlı güncellemek için
        if (onCrosshairChange) {
            chart.subscribeAction('onCrosshairChange', onCrosshairChange);
        }

        chartInstance.current = chart;

        // Resize handler
        const handleResize = () => {
            if (chartInstance.current) {
                chartInstance.current.resize();
            }
        };
        window.addEventListener('resize', handleResize);

        // Container ilk render'da nihai yüksekliğine geç oturuyor; bu yüzden init anında
        // X-ekseni (tarih/saat) için yer hesaplanmıyor ve eksen görünmüyor. Container'ın
        // kendi boyut değişimini ResizeObserver ile yakalayıp resize() ediyoruz — böylece
        // ilk açılışta da tarih ekseni doğru yere oturuyor (etkileşim beklemeden).
        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(containerRef.current);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            resizeObserver.disconnect();
            if (yAxisDom) {
                yAxisDom.removeEventListener('wheel', onYAxisWheel, { capture: true });
            }
            if (containerRef.current && chartInstance.current) {
                dispose(containerRef.current);
                chartInstance.current = null;
            }
        };
    }, [isLineChart, isNone, chartType]);

    return chartInstance;
};
