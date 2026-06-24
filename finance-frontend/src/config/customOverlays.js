import { registerOverlay } from 'klinecharts';

export const registerCustomOverlays = () => {
    registerOverlay({
        name: 'measureRuler',
        totalStep: 3,
        needDefaultPointFigure: true,
        needDefaultXAxisFigure: true,
        needDefaultYAxisFigure: true,
        createPointFigures: ({ overlay, coordinates, precision }) => {
            if (coordinates.length < 2) return [];

            const [start, end] = coordinates;

            // Fiyat/zaman aralığını boyayan dikdörtgen (highlight)
            const polygon = {
                type: 'polygon',
                attrs: {
                    coordinates: [
                        { x: start.x, y: start.y },
                        { x: end.x, y: start.y },
                        { x: end.x, y: end.y },
                        { x: start.x, y: end.y }
                    ]
                },
                styles: { style: 'fill', color: 'rgba(41, 98, 255, 0.15)' }
            };

            const p1 = overlay.points[0];
            const p2 = overlay.points[1];

            if (!p1 || !p2 || p1.value === undefined || p2.value === undefined) {
                return [polygon];
            }

            const priceDiff = p2.value - p1.value;
            const percent = (priceDiff / p1.value) * 100;
            const bars = Math.abs((p2.dataIndex || 0) - (p1.dataIndex || 0));

            // Bilgi kutucuğu (Metin)
            const textBgColor = priceDiff >= 0 ? 'rgba(8, 153, 129, 0.9)' : 'rgba(242, 54, 69, 0.9)'; // TradingView yeşili ve kırmızısı
            const sign = priceDiff > 0 ? '+' : '';

            const textLabel = {
                type: 'text',
                attrs: {
                    x: start.x + (end.x - start.x) / 2,
                    y: end.y - 10,
                    text: `${sign}${priceDiff.toFixed(precision.price)} (${sign}${percent.toFixed(2)}%) | ${bars} Çubuk`,
                    align: 'center',
                    baseline: 'bottom'
                },
                styles: {
                    color: '#fff',
                    size: 13,
                    paddingLeft: 8,
                    paddingRight: 8,
                    paddingTop: 6,
                    paddingBottom: 6,
                    backgroundColor: textBgColor,
                    borderRadius: 4
                }
            };

            return [polygon, textLabel];
        }
    });

    registerOverlay({
        name: 'customRect',
        totalStep: 3,
        needDefaultPointFigure: true,
        needDefaultXAxisFigure: true,
        needDefaultYAxisFigure: true,
        createPointFigures: ({ coordinates }) => {
            if (coordinates.length < 2) return [];
            const [start, end] = coordinates;
            return [
                {
                    type: 'polygon',
                    attrs: {
                        coordinates: [
                            { x: start.x, y: start.y },
                            { x: end.x, y: start.y },
                            { x: end.x, y: end.y },
                            { x: start.x, y: end.y }
                        ]
                    },
                    styles: {
                        style: 'stroke_fill',
                        color: 'rgba(41, 98, 255, 0.2)',
                        stroke: { color: '#2962ff', size: 1, style: 'solid' }
                    }
                }
            ];
        }
    });

    registerOverlay({
        name: 'customText',
        totalStep: 2,
        needDefaultPointFigure: true,
        needDefaultXAxisFigure: true,
        needDefaultYAxisFigure: true,
        createPointFigures: ({ overlay, coordinates }) => {
            if (coordinates.length < 1) return [];
            return [
                {
                    type: 'text',
                    attrs: {
                        x: coordinates[0].x,
                        y: coordinates[0].y,
                        text: overlay.extendData || '',
                        align: 'left',
                        baseline: 'middle'
                    },
                    styles: {
                        color: '#2962ff',
                        size: 16,
                        backgroundColor: 'transparent',
                    }
                }
            ];
        }
    });

    // FIBONACCI RETRACEMENT — kullanıcı 2 nokta seçer (zirve/dip), 7 seviye çizilir.
    // Seviyeler: 0%, 23.6%, 38.2%, 50%, 61.8%, 78.6%, 100%. Her seviye yatay çizgi + sol etiket.
    registerOverlay({
        name: 'fibonacciRetracement',
        totalStep: 3,
        needDefaultPointFigure: true,
        needDefaultXAxisFigure: true,
        needDefaultYAxisFigure: true,
        createPointFigures: ({ overlay, coordinates, precision }) => {
            if (coordinates.length < 2) return [];
            const [start, end] = coordinates;
            const p1 = overlay.points[0];
            const p2 = overlay.points[1];
            if (!p1 || !p2 || p1.value === undefined || p2.value === undefined) return [];

            // Standart fibonacci retracement seviyeleri ve TradingView-uyumlu renkler
            const LEVELS = [
                { ratio: 0,     color: '#787b86' },
                { ratio: 0.236, color: '#f23645' },
                { ratio: 0.382, color: '#ff9800' },
                { ratio: 0.5,   color: '#089981' },
                { ratio: 0.618, color: '#2962ff' },
                { ratio: 0.786, color: '#9c27b0' },
                { ratio: 1,     color: '#787b86' }
            ];

            const xLeft = Math.min(start.x, end.x);
            const xRight = Math.max(start.x, end.x);
            const priceDiff = p2.value - p1.value;
            const yDiff = end.y - start.y;

            const figures = [];
            LEVELS.forEach(({ ratio, color }) => {
                // Seviye fiyatı: p1 + ratio * (p2 - p1); Y koordinatı orantılı interpolasyon
                const levelPrice = p1.value + ratio * priceDiff;
                const levelY = start.y + ratio * yDiff;

                figures.push({
                    type: 'line',
                    attrs: { coordinates: [{ x: xLeft, y: levelY }, { x: xRight, y: levelY }] },
                    styles: { color, size: 1, style: ratio === 0 || ratio === 1 ? 'solid' : 'dashed' }
                });

                figures.push({
                    type: 'text',
                    attrs: {
                        x: xLeft - 6,
                        y: levelY,
                        text: `${(ratio * 100).toFixed(1)}%  ${levelPrice.toFixed(precision.price)}`,
                        align: 'right',
                        baseline: 'middle'
                    },
                    styles: { color, size: 11, backgroundColor: 'transparent' }
                });
            });
            return figures;
        }
    });

    registerOverlay({
        name: 'customArrow',
        totalStep: 3,
        needDefaultPointFigure: true,
        needDefaultXAxisFigure: true,
        needDefaultYAxisFigure: true,
        createPointFigures: ({ coordinates }) => {
            if (coordinates.length < 2) return [];

            const [start, end] = coordinates;
            const arrowSize = 10;
            const angle = Math.atan2(end.y - start.y, end.x - start.x);

            return [
                {
                    type: 'line',
                    attrs: { coordinates: [start, end] },
                    styles: { color: '#2962ff', size: 2 }
                },
                {
                    type: 'polygon',
                    attrs: {
                        coordinates: [
                            end,
                            {
                                x: end.x - arrowSize * Math.cos(angle - Math.PI / 6),
                                y: end.y - arrowSize * Math.sin(angle - Math.PI / 6)
                            },
                            {
                                x: end.x - arrowSize * Math.cos(angle + Math.PI / 6),
                                y: end.y - arrowSize * Math.sin(angle + Math.PI / 6)
                            }
                        ]
                    },
                    styles: { style: 'fill', color: '#2962ff' }
                }
            ];
        }
    });
};
