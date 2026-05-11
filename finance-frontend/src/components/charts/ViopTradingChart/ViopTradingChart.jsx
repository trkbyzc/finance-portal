import React, { useEffect, useRef, useState, useMemo } from 'react';
import { init, dispose } from 'klinecharts';
import { useViopChartData, getPastDate } from '../../../hooks/charts/useViopChartData';
import ViopHeader from './components/ViopHeader';
import ViopControls from './components/ViopControls';
import ViopChartArea from './components/ViopChartArea';

// 🚀 FAZA 1: Veri çekme useEffect'i kaldırıldı, custom hook kullanılıyor
export default function ViopTradingChart({ asset }) {
    const chartContainerRef = useRef(null);
    const chartInstance = useRef(null);
    const [range, setRange] = useState('1mo');

    // 🚀 FAZA 1: Tarih hesaplama useMemo ile derived state
    const { fromDate, toDate } = useMemo(() => ({
        fromDate: getPastDate(30),
        toDate: getPastDate(0)
    }), []);

    const [customFromDate, setCustomFromDate] = useState(fromDate);
    const [customToDate, setCustomToDate] = useState(toDate);

    const handleRangeChange = (newRange) => {
        setRange(newRange);
        if (newRange === '1w') setCustomFromDate(getPastDate(7));
        if (newRange === '1mo') setCustomFromDate(getPastDate(30));
        if (newRange === '1y') setCustomFromDate(getPastDate(365));
    };

    // ✅ React Query ile veri çekme - range parametresi eklendi
    const { data: chartData = [], isLoading: loading } = useViopChartData(
        asset?.symbol, 
        customFromDate, 
        customToDate,
        range  // ✅ range parametresi gönderiliyor
    );

    // Chart instance kurulumu (DOM manipulation)
    useEffect(() => {
        if (!chartContainerRef.current) return;
        dispose(chartContainerRef.current);

        chartInstance.current = init(chartContainerRef.current, {
            styles: {
                grid: {
                    horizontal: { show: true, color: '#2a2e39', style: 'dash' },
                    vertical: { show: false }
                },
                candle: {
                    type: 'area',
                    area: {
                        lineSize: 2,
                        lineColor: '#2962ff',
                        fillColor: [
                            { offset: 0, color: 'rgba(41, 98, 255, 0.1)' }, 
                            { offset: 1, color: 'rgba(41, 98, 255, 0.01)' }
                        ]
                    },
                    tooltip: { showRule: 'always' }
                },
                xAxis: { axisLine: { color: '#2a2e39' }, tickText: { color: '#868993' } },
                yAxis: { position: 'right', tickText: { color: '#868993' } },
                timeZone: 'Europe/Istanbul'
            }
        });

        return () => {
            if (chartInstance.current) {
                dispose(chartContainerRef.current);
                chartInstance.current = null;
            }
        };
    }, []);

    // Chart data güncelleme (side effect)
    useEffect(() => {
        if (chartInstance.current && chartData.length > 0) {
            chartInstance.current.applyNewData(chartData);
        } else if (chartInstance.current) {
            chartInstance.current.applyNewData([]);
        }
    }, [chartData]);

    return (
        <div className="flex flex-col w-full h-full bg-[#0b0e14] text-white">
            <ViopHeader asset={asset} />
            <ViopControls
                range={range}
                handleRangeChange={handleRangeChange}
                fromDate={customFromDate}
                toDate={customToDate}
            />
            <ViopChartArea
                chartContainerRef={chartContainerRef}
                loading={loading}
            />
        </div>
    );
}