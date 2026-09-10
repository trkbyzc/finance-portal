import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { LineChart as LineChartIcon, Plus, Loader2 } from 'lucide-react';

import { simulationApi } from '../../services/api/simulationApi';
import CreateSimulationModal from '../../components/simulation/CreateSimulationModal';
import SimulationCard from '../../components/simulation/SimulationCard';
import SimulationDetailModal from '../../components/simulation/SimulationDetailModal';
import Modal from '../../components/layout/Modal';

export default function SimulationPage() {
    const { t } = useTranslation(['simulation', 'common']);
    const queryClient = useQueryClient();

    const [createOpen, setCreateOpen] = useState(false);
    const [detailSim, setDetailSim] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const { data: sims = [], isLoading, isError } = useQuery({
        queryKey: ['simulations'],
        queryFn: simulationApi.getMySimulations
    });

    const createMutation = useMutation({
        mutationFn: simulationApi.createSimulation,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['simulations'] })
    });

    const deleteMutation = useMutation({
        mutationFn: simulationApi.deleteSimulation,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['simulations'] })
    });

    const handlePreview = (body) => simulationApi.previewSimulation(body);
    const handleSave = (body) => createMutation.mutateAsync(body);

    const handleDelete = (sim) => setDeleteTarget(sim);
    const confirmDelete = () => {
        if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        setDeleteTarget(null);
    };

    return (
        <div className="min-h-screen bg-bg text-text p-4 md:p-8">
            <div className="max-w-[1400px] mx-auto">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                            <LineChartIcon size={20} />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold">{t('simulation:pageTitle')}</h1>
                    </div>
                    <button
                        onClick={() => setCreateOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-primary-fg rounded-lg font-semibold transition"
                    >
                        <Plus size={18} /> {t('simulation:actions.new')}
                    </button>
                </div>
                <p className="text-text-muted mb-8">{t('simulation:pageSubtitle')}</p>

                {isLoading ? (
                    <div className="flex items-center justify-center py-20 text-text-muted">
                        <Loader2 className="animate-spin mr-3" size={24} />
                        <span>{t('common:status.loading')}</span>
                    </div>
                ) : isError ? (
                    <div className="bg-sell/10 border border-sell/30 rounded-xl p-6 text-sell">
                        {t('simulation:toast.error')}
                    </div>
                ) : sims.length === 0 ? (
                    <div className="bg-surface border border-border rounded-2xl p-12 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mx-auto mb-4 flex items-center justify-center text-primary">
                            <LineChartIcon size={28} />
                        </div>
                        <h2 className="text-xl font-bold mb-2">{t('simulation:empty.title')}</h2>
                        <p className="text-text-muted mb-6 max-w-md mx-auto">{t('simulation:empty.subtitle')}</p>
                        <button
                            onClick={() => setCreateOpen(true)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-primary-fg rounded-lg font-semibold transition"
                        >
                            <Plus size={18} /> {t('simulation:empty.cta')}
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {sims.map(sim => (
                            <SimulationCard
                                key={sim.id}
                                sim={sim}
                                onDetail={() => setDetailSim(sim)}
                                onDelete={() => handleDelete(sim)}
                                t={t}
                            />
                        ))}
                    </div>
                )}

                <CreateSimulationModal
                    isOpen={createOpen}
                    onClose={() => setCreateOpen(false)}
                    onPreview={handlePreview}
                    onSave={handleSave}
                />

                {detailSim && (
                    <SimulationDetailModal
                        sim={detailSim}
                        onClose={() => setDetailSim(null)}
                        t={t}
                    />
                )}

                <Modal
                    isOpen={!!deleteTarget}
                    type="error"
                    title={t('simulation:actions.remove', 'Sil')}
                    message={t('simulation:actions.removeConfirm', { symbol: deleteTarget?.symbol })}
                    confirmText={t('common:actions.delete', 'Sil')}
                    showCancel
                    onCancel={() => setDeleteTarget(null)}
                    onClose={confirmDelete}
                />
            </div>
        </div>
    );
}
