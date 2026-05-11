import React from 'react';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { commodityApi } from '../../services/api';

import GoldHeader from './components/GoldHeader';
import GoldListHeader from './components/GoldListHeader';
import GoldRow from './components/GoldRow';

export default function TurkishGoldPage() {
    const navigate = useNavigate();

    // 🚀 useEffect ve useState silindi. Yerine React Query geldi!
    const { data: golds = [], isLoading: loading } = useQuery({
        queryKey: ['turkishGoldData'],
        queryFn: async () => {
            // Eskiden getAllMarkets() çekilip filtreleniyordu. Artık sadece bu sayfaya ait özel service çağırılıyor.
            const response = await commodityApi.getTurkishGold();
            return response || [];
        },
        staleTime: 60 * 1000 // 1 dakika cash
    });

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-[#0b0e14]">
            <Loader2 className="animate-spin text-[#2962ff]" size={48} />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0b0e14] text-white p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                <GoldHeader />

                <div className="bg-[#131722] border border-[#2a2e39] rounded-2xl overflow-hidden shadow-2xl">
                    <GoldListHeader />

                    <div className="divide-y divide-[#2a2e39]">
                        {golds.length > 0 ? (
                            golds.map((gold, index) => (
                                <GoldRow key={index} gold={gold} navigate={navigate} />
                            ))
                        ) : (
                            <div className="p-8 text-center text-[#868993]">
                                Kapalıçarşı altın verileri şu an alınamıyor.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}