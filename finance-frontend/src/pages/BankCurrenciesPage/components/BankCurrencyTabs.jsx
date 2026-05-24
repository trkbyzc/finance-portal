import React from 'react';
import { DollarSign, Euro, PoundSterling } from 'lucide-react';

export const TABS = [
    { id: 'USD', label: 'USD', icon: <DollarSign size={18} /> },
    { id: 'EUR', label: 'EUR', icon: <Euro size={18} /> },
    { id: 'GBP', label: 'GBP', icon: <PoundSterling size={18} /> },
];

export default function BankCurrencyTabs({ selectedCurrency, setSelectedCurrency }) {
    return (
        <div className="flex gap-4 mb-8 border-b border-border pb-px">
            {TABS.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setSelectedCurrency(tab.id)}
                    className={`flex items-center gap-2 px-6 py-3 font-bold text-sm transition-all border-b-2 ${
                        selectedCurrency === tab.id
                            ? 'border-primary text-text bg-primary/10 rounded-t-lg'
                            : 'border-transparent text-text-muted hover:text-text hover:bg-surface-2 rounded-t-lg'
                    }`}
                >
                    {tab.icon}
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
