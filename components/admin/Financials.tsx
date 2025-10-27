import React, { useState, useEffect } from 'react';
import { FinancialRecord } from '../../types';
import { DollarSign } from '../icons/AdminIcons';
import { FileDown } from '../icons/Actions';
import { Pencil, Trash2 } from '../icons/EditorIcons';
import { PlusCircle } from '../icons/EditorIcons';
import FinancialsModal from './FinancialsModal';

const Financials: React.FC = () => {
    // Initialize state by reading from localStorage directly. This runs only once.
    const [transactions, setTransactions] = useState<FinancialRecord[]>(() => {
        try {
            const storedData = localStorage.getItem('nutriflow_financials');
            if (storedData) {
                return JSON.parse(storedData);
            }
        } catch (error) {
            console.error("Failed to load financial records on init:", error);
        }
        // Return default/example data if nothing is stored or parsing fails
        return [
            { id: 't1', userName: 'João Silva', userEmail: 'joao.silva@email.com', amount: 29.90, date: '2024-07-20', status: 'Aprovado' },
            { id: 't2', userName: 'Maria Gomes', userEmail: 'maria.gomes@email.com', amount: 29.90, date: '2024-07-20', status: 'Aprovado' },
            { id: 't3', userName: 'Carlos Pereira', userEmail: 'carlos.pereira@email.com', amount: 29.90, date: '2024-07-19', status: 'Pendente' },
        ];
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<FinancialRecord | null>(null);

    // This effect runs whenever the `transactions` state changes, persisting it to localStorage.
    useEffect(() => {
        try {
            localStorage.setItem('nutriflow_financials', JSON.stringify(transactions));
        } catch (error) {
            console.error("Error saving financial records to localStorage:", error);
            // This is where the circular dependency error would be caught.
        }
    }, [transactions]);

    const handleSaveRecord = (record: FinancialRecord) => {
        // Use functional update to avoid stale state issues.
        setTransactions(currentTransactions => {
            const recordExists = currentTransactions.some(t => t.id === record.id);
            if (recordExists) {
                // Edit existing record
                return currentTransactions.map(t => (t.id === record.id ? record : t));
            } else {
                // Add new record
                return [...currentTransactions, record];
            }
        });
    };

    const handleDeleteRecord = (id: string) => {
        if (window.confirm("Tem certeza que deseja excluir este registro financeiro?")) {
            // Use functional update for safe state modification.
            setTransactions(currentTransactions =>
                currentTransactions.filter(t => t.id !== id)
            );
        }
    };
    
    const openModalForEdit = (record: FinancialRecord) => {
        setEditingRecord(record);
        setIsModalOpen(true);
    };

    const openModalForNew = () => {
        setEditingRecord(null);
        setIsModalOpen(true);
    };

    const totalRevenue = transactions
        .filter(t => t.status === 'Aprovado')
        .reduce((sum, t) => sum + t.amount, 0)
        .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    
    const getStatusChip = (status: string) => {
        switch (status) {
            case 'Aprovado':
                return <span className="px-2 py-1 text-xs font-semibold text-green-300 bg-green-500/20 rounded-full">Aprovado</span>;
            case 'Pendente':
                return <span className="px-2 py-1 text-xs font-semibold text-yellow-300 bg-yellow-500/20 rounded-full">Pendente</span>;
            case 'Falhou':
                 return <span className="px-2 py-1 text-xs font-semibold text-red-300 bg-red-500/20 rounded-full">Falhou</span>;
            default:
                return <span className="px-2 py-1 text-xs font-semibold text-slate-400 bg-slate-600/50 rounded-full">{status}</span>;
        }
    };


    return (
        <div className="animate-fade-in">
            <h1 className="text-3xl font-bold text-cyan-400 mb-8">Financeiro</h1>
            
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 mb-8">
                <h2 className="text-xl font-bold text-white mb-4">Visão Geral da Receita</h2>
                <div className="flex items-center gap-4 text-green-400">
                    <DollarSign className="w-10 h-10" />
                    <div>
                        <p className="text-sm text-slate-400">Faturamento Aprovado</p>
                        <p className="text-4xl font-bold">{totalRevenue}</p>
                    </div>
                </div>
            </div>

            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                    <h2 className="text-xl font-bold text-white">Todas as Transações</h2>
                    <div className="flex items-center gap-4">
                        <button onClick={openModalForNew} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-sm font-semibold">
                            <PlusCircle className="w-5 h-5" />
                            Novo Registro
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-semibold">
                            <FileDown className="w-4 h-4" />
                            Exportar CSV
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-slate-600">
                            <tr>
                                <th className="p-3 font-semibold">Usuário</th>
                                <th className="p-3 font-semibold">Valor</th>
                                <th className="p-3 font-semibold">Data</th>
                                <th className="p-3 font-semibold">Status</th>
                                <th className="p-3 font-semibold">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(tx => (
                                <tr key={tx.id} className="border-b border-slate-700 last:border-0 hover:bg-slate-700/50">
                                    <td className="p-3">
                                        {tx.userName}
                                        <span className="block text-xs text-slate-500">{tx.userEmail}</span>
                                    </td>
                                    <td className="p-3">{tx.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                    <td className="p-3 text-slate-400">{new Date(tx.date).toLocaleDateString('pt-BR')}</td>
                                    <td className="p-3">{getStatusChip(tx.status)}</td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => openModalForEdit(tx)} className="p-2 text-slate-400 hover:text-cyan-400" title="Editar">
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDeleteRecord(tx.id)} className="p-2 text-slate-400 hover:text-red-400" title="Excluir">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 {transactions.length === 0 && (
                    <p className="p-8 text-center text-slate-500">Nenhum registro financeiro encontrado.</p>
                )}
            </div>
            {isModalOpen && (
                <FinancialsModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveRecord}
                    record={editingRecord}
                />
            )}
        </div>
    );
};

export default Financials;