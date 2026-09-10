export const getViopChartStyles = () => ({
    grid: {
        horizontal: { 
            show: true, 
            color: '#2a2e39', 
            style: 'dash' 
        },
        vertical: { 
            show: false 
        }
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
        tooltip: { 
            showRule: 'always',
            showType: 'rect',
            text: {
                size: 12,
                color: '#d1d4dc'
            }
        }
    },
    xAxis: { 
        axisLine: { color: '#2a2e39' }, 
        tickText: { color: '#868993' } 
    },
    yAxis: { 
        position: 'right', 
        tickText: { color: '#868993' } 
    },
    timeZone: 'Europe/Istanbul'
});

export const VIOP_RANGE_OPTIONS = [
    { id: '1w', label: '1 Hafta', days: 7 },
    { id: '1mo', label: '1 Ay', days: 30 },
    { id: '1y', label: '1 Yıl', days: 365 }
];
