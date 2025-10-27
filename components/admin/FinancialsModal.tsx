import React, { useState, useEffect } from 'react';
import { FinancialRecord } from '../../types';
import { X } from '../icons/ChatIcons';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: FinancialRecord) => void;
  record: FinancialRecord | null;
}

const FinancialsModal: React.FC<Props> = ({ isOpen, onClose, onSave, record }) => {
  const [formData, setFormData] = useState<Omit<FinancialRecord, 'id'>>({
    userName: '',
    userEmail: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    status: 'Aprovado',
    notes: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (record) {
      setFormData({
        userName: record.userName,
        userEmail: record.userEmail,
        amount: record.amount,
        date: record.date,
        status: record.status,
        notes: record.notes || '',
      });
    } else {
      setFormData({
        userName: '',
        userEmail: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        status: 'Aprovado',
        notes: '',
      });
    }
  }, [record, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'amount' ? parseFloat(value) : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.userName || !formData.userEmail || formData.amount <= 0) {
        setError('Por favor, preencha o nome, e-mail e um valor válido.');
        return;
    }
    onSave({
      id: record?.id || new Date().toISOString(),
      ...formData,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-lg w-full max-w-lg max-h-[90vh] flex flex-col">
        <header className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-cyan-400">{record ? 'Editar' : 'Adicionar'} Registro Financeiro</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-700">
            <X className="w-6 h-6" />
          </button>
        </header>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
            <div>
              <label htmlFor="userName" className="block text-sm font-medium text-slate-300 mb-2">Nome do Usuário</label>
              <input type="text" name="userName" id="userName" value={formData.userName} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3" required />
            </div>
            <div>
              <label htmlFor="userEmail" className="block text-sm font-medium text-slate-300 mb-2">E-mail do Usuário</label>
              <input type="email" name="userEmail" id="userEmail" value={formData.userEmail} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-slate-300 mb-2">Valor (R$)</label>
                    <input type="number" name="amount" id="amount" value={formData.amount} onChange={handleChange} step="0.01" className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3" required />
                </div>
                 <div>
                    <label htmlFor="date" className="block text-sm font-medium text-slate-300 mb-2">Data</label>
                    <input type="date" name="date" id="date" value={formData.date} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3" required />
                </div>
            </div>
             <div>
                <label htmlFor="status" className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                <select name="status" id="status" value={formData.status} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3">
                    <option value="Aprovado">Aprovado</option>
                    <option value="Pendente">Pendente</option>
                    <option value="Falhou">Falhou</option>
                </select>
             </div>
             <div>
                <label htmlFor="notes" className="block text-sm font-medium text-slate-300 mb-2">Observações</label>
                <textarea name="notes" id="notes" value={formData.notes} onChange={handleChange} rows={3} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3"></textarea>
             </div>
             {error && <p className="text-red-400 text-sm">{error}</p>}
        </main>

        <footer className="p-4 border-t border-slate-700">
          <button 
            type="submit"
            onClick={handleSubmit}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all"
          >
            Salvar Registro
          </button>
        </footer>
      </div>
    </div>
  );
};

export default FinancialsModal;
