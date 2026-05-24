import React from 'react';
import { Edit3, Minus, Square, ArrowUpRight, Type, Ruler, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ChartSidebar({ onDraw, onRemoveAll }) {
    const { t } = useTranslation('charts');

    const DRAWING_TOOLS = [
        { id: 'segment', icon: Edit3, label: t('tools.trendLine') },
        { id: 'horizontalStraightLine', icon: Minus, label: t('tools.horizontalLine'), strokeWidth: 3 },
        { id: 'customRect', icon: Square, label: t('tools.rectangle') },
        { id: 'customArrow', icon: ArrowUpRight, label: t('tools.trendLine') },
        { id: 'customText', icon: Type, label: t('header.settings') },
        { id: 'measureRuler', icon: Ruler, label: t('tools.fibonacci') }
    ];

    return (
        <div className="w-12 bg-surface-2 border-r border-border flex flex-col items-center py-4 gap-2 z-10 shrink-0">
            {DRAWING_TOOLS.map((tool) => (
                <div key={tool.id} className="relative group flex items-center justify-center w-full">
                    <button
                        onClick={() => onDraw(tool.id)}
                        className="p-2 text-text-muted hover:text-text hover:bg-surface-hover rounded transition-colors"
                    >
                        <tool.icon size={18} strokeWidth={tool.strokeWidth || 2} />
                    </button>
                    <div className="absolute left-full ml-3 px-2 py-1.5 bg-surface text-text text-xs font-bold rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 pointer-events-none shadow-lg border border-border">
                        {tool.label}
                    </div>
                </div>
            ))}
            <div className="flex-1"></div>
            <div className="relative group flex items-center justify-center w-full mb-2">
                <button
                    onClick={onRemoveAll}
                    className="p-2 text-sell/70 hover:text-sell hover:bg-sell/10 rounded transition-colors"
                >
                    <Trash2 size={18} />
                </button>
                <div className="absolute left-full ml-3 px-2 py-1.5 bg-sell/15 text-sell border border-sell/30 text-xs font-bold rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 pointer-events-none shadow-lg">
                    {t('tools.removeAll')}
                </div>
            </div>
        </div>
    );
}
