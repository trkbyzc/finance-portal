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
                    x: start.x + (end.x - start.x) / 2, // Kutunun tam ortasında yatayda hizala
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

    // 1. DİKDÖRTGEN (RECTANGLE) ÇİZİM ARACI
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

    // 2. METİN (TEXT) ÇİZİM ARACI
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

    // OK çizgisi

    registerOverlay({
        name: 'customArrow',
        totalStep: 3,
        needDefaultPointFigure: true,
        needDefaultXAxisFigure: true,
        needDefaultYAxisFigure: true,
        createPointFigures: ({ coordinates }) => {
            if (coordinates.length < 2) return [];

            const [start, end] = coordinates;
            const arrowSize = 10; // Ok başının büyüklüğü
            const angle = Math.atan2(end.y - start.y, end.x - start.x);

            return [
                {
                    // Ana Çizgi (Gövde)
                    type: 'line',
                    attrs: { coordinates: [start, end] },
                    styles: { color: '#2962ff', size: 2 }
                },
                {
                    // Ok Başı (Üçgen veya Poligon)
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
