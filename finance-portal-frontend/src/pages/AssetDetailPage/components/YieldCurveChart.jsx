import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const YieldCurveChart = ({ data }) => {
    // Veri backend'den sıralı geldiği için sort işlemine gerek yok
    return (
        <div className="w-full h-full pb-4">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2e39" vertical={false} />
                    <XAxis
                        dataKey="label" // "name" yerine "label" (3 Ay, 6 Ay, 1 Yıl vs.) kullanıyoruz
                        stroke="#d1d4dc"
                        tick={{ fontSize: 12, fontWeight: 'bold' }}
                        interval={0}
                    />
                    <YAxis
                        stroke="#d1d4dc"
                        domain={['auto', 'auto']}
                        tickFormatter={(value) => `%${value}`}
                        tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1e222d', border: '1px solid #2a2e39', borderRadius: '8px', color: '#fff' }}
                        itemStyle={{ color: '#089981', fontWeight: 'bold' }}
                        labelStyle={{ color: '#868993', marginBottom: '4px', textTransform: 'uppercase' }}
                        formatter={(value) => [`%${value}`, 'Bileşik Getiri']}
                    />
                    <Line
                        type="monotone"
                        dataKey="yield"
                        stroke="#2962ff"
                        strokeWidth={4}
                        dot={{ r: 6, fill: '#131722', strokeWidth: 3, stroke: '#2962ff' }}
                        activeDot={{ r: 8, fill: '#2962ff', strokeWidth: 0 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default YieldCurveChart;