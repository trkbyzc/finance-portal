
export const getChartStyles = (chartType = 'candle_solid') => ({
    // tooltip.showRule 'none': klinecharts'ın üstteki "Time/Open/High..." legend'ı gizlenir
    // (artık kendi OHLCV kartlarımız var). Crosshair çizgileri bundan etkilenmez.
    candle: { type: chartType, tooltip: { showRule: 'none' } },
    grid: { 
        show: true, 
        horizontal: { color: '#2a2e39', style: 'dashed' }, 
        vertical: { color: '#2a2e39', style: 'dashed' } 
    },
    xAxis: { 
        tickText: { color: '#787b86' }, 
        axisLine: { color: '#2a2e39' } 
    },
    yAxis: { 
        tickText: { color: '#787b86' }, 
        axisLine: { color: '#2a2e39' } 
    },
    indicator: { 
        tooltip: { 
            showRule: 'rect', 
            showName: true, 
            showParams: true 
        } 
    },
    timeZone: 'Europe/Istanbul'
});

export const CHART_TYPES = {
    CANDLE_SOLID: 'candle_solid',
    CANDLE_STROKE: 'candle_stroke',
    CANDLE_UP_STROKE: 'candle_up_stroke',
    CANDLE_DOWN_STROKE: 'candle_down_stroke',
    OHLC: 'ohlc',
    AREA: 'area'
};

export const AVAILABLE_INDICATORS = [
    { id: 'MA', name: 'Moving Average', pane: 'candle_pane' },
    { id: 'BOLL', name: 'Bollinger Bands', pane: 'candle_pane' },
    { id: 'VOL', name: 'Volume', pane: 'pane_VOL' },
    { id: 'MACD', name: 'MACD', pane: 'pane_MACD' },
    { id: 'RSI', name: 'RSI', pane: 'pane_RSI' },
    { id: 'KDJ', name: 'KDJ', pane: 'pane_KDJ' }
];

export const DRAWING_TOOLS = [
    { id: 'segment', name: 'Çizgi', icon: '📏' },
    { id: 'ray', name: 'Işın', icon: '➡️' },
    { id: 'horizontalRayLine', name: 'Yatay Çizgi', icon: '↔️' },
    { id: 'fibonacciLine', name: 'Fibonacci', icon: '🔢' },
    { id: 'customText', name: 'Metin', icon: '📝' }
];
