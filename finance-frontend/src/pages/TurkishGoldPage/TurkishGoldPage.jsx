import React from 'react';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { commodityApi } from '../../services/api';

import GoldHeader from './components/GoldHeader';
import GoldListHeader from './components/GoldListHeader';
import GoldRow from './components/GoldRow';

export default function TurkishGoldPage() {
    const navigate = useNavigate();
    const { t } = useTranslation(['markets', 'common']);

    const { data: golds = [], isLoading: loading } = useQuery({
        queryKey: ['turkishGoldData'],
        queryFn: async () => {
            const response = await commodityApi.getTurkishGold();
            return response || [];
        },
        staleTime: 60 * 1000
    });

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-bg">
            <Loader2 className="animate-spin text-primary" size={48} />
        </div>
    );

    return (
        <div className="min-h-screen bg-bg text-text p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                <GoldHeader />

                <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-2xl">
                    <GoldListHeader />

                    <div className="divide-y divide-[#2a2e39]">
                        {golds.length > 0 ? (
                            golds.map((gold, index) => (
                                <GoldRow key={index} gold={gold} navigate={navigate} />
                            ))
                        ) : (
                            <div className="p-8 text-center text-text-muted">
                                {t('common:status.noData')}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
