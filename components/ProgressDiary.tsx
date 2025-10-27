
import React, { useState, useMemo } from 'react';
import { ProgressEntry } from '../types';
import LineChart from './LineChart';
import { Trash2, PlusCircle } from './icons/EditorIcons';
import { Weight, Ruler, Activity } from 'lucide-react';

interface Props {
  progressHistory: ProgressEntry[];
  onAddEntry: (entry: Omit<ProgressEntry, 'id'>) => void;
  onDeleteEntry: (id: string) => void;
}

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string; color: string; }> = ({ icon, label, value, color }) => (
    <div className="flex-1 p-4 bg-slate-800 rounded-xl border border-slate-700 flex items-start gap-4">
        <div className={`p-2 rounded-full ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-slate-400">{label}</p>
            <p className="text-xl font-bold text-white">{value}</p>
        </div>
    </div>
);

const ProgressDiary: React.FC<Props> = ({ progressHistory, onAddEntry, onDeleteEntry }) => {
    const today = new Date().toISOString().split('T')[0];
    const [formData, setFormData] = useState({
        date: today,
        weight: '',
        waist: '',
        hips: '',
        notes: '',
    });
    
    const sortedHistory = useMemo(() => 
        [...progressHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
        [progressHistory]
    );

    const weightChartData = useMemo(() => 
        sortedHistory.map(entry => ({ label: entry.date, value: entry.weight })),
        [sortedHistory]
    );

    const summaryStats = useMemo(() => {
        if (sortedHistory.length === 0) {
            return { currentWeight: '--', weightChange: '--', latestWaist: '--', latestHips: '--' };
        }
        const firstEntry = sortedHistory[0];
        const latestEntry = sortedHistory[sortedHistory.length - 1];
        const weightChange = latestEntry.weight - firstEntry.weight;

        const findLastValid = (key: 'waist' | 'hips') => {
            for (let i = sortedHistory.length - 1; i >= 0; i--) {
                if (sortedHistory[i][key]) {
                    return `${sortedHistory[i][key]} cm`;
                }
            }
            return '--';
        }

        return {
            currentWeight: `${latestEntry.weight.toFixed(1)} kg`,
            weightChange: `${weightChange >= 0 ? '+' : ''}${weightChange.toFixed(1)} kg`,
            latestWaist: findLastValid('waist'),
            latestHips: findLastValid('hips'),
        };
    }, [sortedHistory]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { date, weight, waist, hips, notes } = formData;
        if (!weight) {
            alert("O peso é obrigatório.");
            return;
        }
        onAddEntry({
            date,
            weight: parseFloat(weight),
            waist: waist ? parseFloat(waist) : undefined,
            hips: hips ? parseFloat(hips) : undefined,
            notes,
        });
        // Reset form except for date
        setFormData({ date: formData.date, weight: '', waist: '', hips: '', notes: '' });
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <h1 className="text-3xl font-bold text-cyan-400 text-center">Meu Diário de Progresso</h1>

            {/* --- Summary Stats --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Peso Atual" value={summaryStats.currentWeight} icon={<Weight className="w-6 h-6 text-slate-900" />} color="bg-cyan-400" />
                <StatCard label="Mudança Total" value={summaryStats.weightChange} icon={<Activity className="w-6 h-6 text-slate-900" />} color="bg-purple-400" />
                <StatCard label="Cintura" value={summaryStats.latestWaist} icon={<Ruler className="w-6 h-6 text-slate-900" />} color="bg-orange-400" />
                <StatCard label="Quadril" value={summaryStats.latestHips} icon={<Ruler className="w-6 h-6 text-slate-900" />} color="bg-pink-400" />
            </div>

            {/* --- Chart --- */}
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                <h2 className="text-xl font-bold text-white mb-4">Evolução do Peso</h2>
                <LineChart data={weightChartData} height={250} />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* --- Add New Entry --- */}
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 self-start">
                    <h2 className="text-xl font-bold text-white mb-4">Adicionar Novo Registro</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-slate-300 mb-1">Data</label>
                            <input type="date" name="date" id="date" value={formData.date} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2" required />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                             <div>
                                <label htmlFor="weight" className="block text-sm font-medium text-slate-300 mb-1">Peso (kg) <span className="text-red-400">*</span></label>
                                <input type="number" name="weight" id="weight" value={formData.weight} onChange={handleChange} step="0.1" className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2" required placeholder="ex: 75.5" />
                            </div>
                             <div>
                                <label htmlFor="waist" className="block text-sm font-medium text-slate-300 mb-1">Cintura (cm)</label>
                                <input type="number" name="waist" id="waist" value={formData.waist} onChange={handleChange} step="0.1" className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2" placeholder="Opcional" />
                            </div>
                             <div>
                                <label htmlFor="hips" className="block text-sm font-medium text-slate-300 mb-1">Quadril (cm)</label>
                                <input type="number" name="hips" id="hips" value={formData.hips} onChange={handleChange} step="0.1" className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2" placeholder="Opcional" />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="notes" className="block text-sm font-medium text-slate-300 mb-1">Observações</label>
                            <textarea name="notes" id="notes" value={formData.notes} onChange={handleChange} rows={3} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2" placeholder="Como você se sentiu hoje? Alguma observação sobre o treino ou dieta?"></textarea>
                        </div>
                        <button type="submit" className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-transform hover:scale-105">
                            <PlusCircle className="w-5 h-5" />
                            Salvar Progresso
                        </button>
                    </form>
                </div>
                {/* --- History --- */}
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                    <h2 className="text-xl font-bold text-white mb-4">Histórico de Registros</h2>
                    {sortedHistory.length > 0 ? (
                        <div className="max-h-[400px] overflow-y-auto pr-2 space-y-3">
                            {[...sortedHistory].reverse().map(entry => (
                                <div key={entry.id} className="bg-slate-900/50 p-3 rounded-lg flex items-center justify-between gap-4">
                                    <div>
                                        <p className="font-semibold text-slate-200">{new Date(entry.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
                                        <p className="text-sm text-slate-400">
                                            {entry.weight}kg
                                            {entry.waist && ` | ${entry.waist}cm`}
                                            {entry.hips && ` | ${entry.hips}cm`}
                                        </p>
                                        {entry.notes && <p className="text-xs text-slate-500 mt-1 italic">"{entry.notes}"</p>}
                                    </div>
                                    <button onClick={() => onDeleteEntry(entry.id)} className="p-2 text-slate-500 hover:text-red-400 rounded-full hover:bg-slate-700 transition-colors flex-shrink-0" title="Excluir registro">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-slate-500 py-8">Nenhum registro encontrado.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProgressDiary;