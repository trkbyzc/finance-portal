import React from 'react';
import { Edit3, Minus, Square, ArrowUpRight, Type, Ruler, Trash2 } from 'lucide-react';

const DRAWING_TOOLS = [
    { id: 'segment', icon: Edit3, label: 'Trend Çizgisi' },
    { id: 'horizontalStraightLine', icon: Minus, label: 'Yatay Çizgi', strokeWidth: 3 },
    { id: 'customRect', icon: Square, label: 'Dikdörtgen' },
    { id: 'customArrow', icon: ArrowUpRight, label: 'Ok İşareti' },
    { id: 'customText', icon: Type, label: 'Metin Ekle' },
    { id: 'measureRuler', icon: Ruler, label: 'Ölçüm Cetveli' }
];

export default function ChartSidebar({ onDraw, onRemoveAll }) {
    return (
        <div className="w-12 bg-[#1e222d] border-r border-[#2a2e39] flex flex-col items-center py-4 gap-2 z-10 shrink-0">
            {DRAWING_TOOLS.map((tool) => (
                <div key={tool.id} className="relative group flex items-center justify-center w-full">
                    <button
                        onClick={() => onDraw(tool.id)}
                        className="p-2 text-[#787b86] hover:text-white hover:bg-[#2a2e39] rounded transition-colors"
                    >
                        <tool.icon size={18} strokeWidth={tool.strokeWidth || 2} />
                    </button>
                    <div className="absolute left-full ml-3 px-2 py-1.5 bg-[#2a2e39] text-white text-xs font-bold rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 pointer-events-none shadow-lg border border-[#363a45]">
                        {tool.label}
                    </div>
                </div>
            ))}
            <div className="flex-1"></div>
            <div className="relative group flex items-center justify-center w-full mb-2">
                <button
                    onClick={onRemoveAll}
                    className="p-2 text-red-500/70 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                >
                    <Trash2 size={18} />
                </button>
                <div className="absolute left-full ml-3 px-2 py-1.5 bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 pointer-events-none shadow-lg">
                    Tüm Çizimleri Sil
                </div>
            </div>
        </div>
    );
}