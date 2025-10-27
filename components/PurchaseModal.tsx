import React from 'react';
import { EbookFile } from '../types';
import { X } from './icons/ChatIcons';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  file: EbookFile | null;
  onConfirm: (file: EbookFile) => void;
}

const PurchaseModal: React.FC<Props> = ({ isOpen, onClose, file, onConfirm }) => {
  if (!isOpen || !file) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-lg w-full max-w-md flex flex-col">
        <header className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-cyan-400">Confirmar Compra</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-700">
            <X className="w-6 h-6" />
          </button>
        </header>
        
        <main className="p-6 text-center">
            <img src={file.coverImage} alt={file.title} className="w-32 h-32 object-cover rounded-lg mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white">{file.title}</h3>
            <p className="text-slate-400 mt-2 mb-6">{file.description}</p>
            <div className="p-4 bg-slate-900/50 rounded-lg">
                <p className="text-slate-300">Valor</p>
                <p className="text-4xl font-extrabold text-cyan-400">R$ {file.price?.toFixed(2)}</p>
            </div>
             <p className="text-xs text-slate-500 mt-4">Esta é uma simulação de compra. Ao confirmar, o arquivo será desbloqueado na sua conta.</p>
        </main>

        <footer className="p-4 border-t border-slate-700">
          <button 
            onClick={() => onConfirm(file)}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-4 rounded-lg transition-all"
          >
            Confirmar e Pagar
          </button>
        </footer>
      </div>
    </div>
  );
};

export default PurchaseModal;
