import React from 'react';
import { Activity, Zap, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function CryptoStats({ coins, loading }) {
    const { t } = useTranslation('markets');
    if (loading) return <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 h-24 animate-pulse bg-surface rounded-xl"></div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-surface border border-border p-5 rounded-2xl flex items-center justify-between shadow-lg group hover:border-primary transition-all">
                <div>
                    <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">{t('crypto.volume24h')}</p>
                    <h3 className="text-xl font-black text-text">$2.4T</h3>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <Activity size={24} />
                </div>
            </div>

            <div className="bg-surface border border-border p-5 rounded-2xl flex items-center justify-between shadow-lg group hover:border-warning transition-all">
                <div>
                    <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">{t('crypto.btcDominance')}</p>
                    <h3 className="text-xl font-black text-warning">52.4%</h3>
                </div>
                <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center text-warning">
                    <Zap size={24} />
                </div>
            </div>

            <div className="bg-surface border border-border p-5 rounded-2xl flex items-center justify-between shadow-lg group hover:border-buy transition-all">
                <div>
                    <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">{t('crypto.activeCoins')}</p>
                    <h3 className="text-xl font-black text-text">{coins.length}</h3>
                </div>
                <div className="w-12 h-12 bg-buy/10 rounded-xl flex items-center justify-center text-buy">
                    <BarChart3 size={24} />
                </div>
            </div>
        </div>
    );
}
