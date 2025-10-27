
import React from 'react';
import { X } from './icons/ChatIcons';
import { AlertTriangle } from './icons/AlertIcons';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const PasswordRecoveryModal: React.FC<Props> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-lg w-full max-w-md flex flex-col">
        <header className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6" />
            Recuperação de Conta
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-700">
            <X className="w-6 h-6" />
          </button>
        </header>
        
        <main className="p-6 text-center space-y-4">
            <p className="text-slate-300">
                Como este aplicativo funciona offline e armazena seus dados apenas no seu navegador, <strong>não podemos enviar um e-mail de redefinição de senha.</strong>
            </p>
            <div className="p-4 bg-red-900/50 border border-red-500/50 rounded-lg">
                 <p className="font-semibold text-red-300">
                    A única forma de recuperar o acesso é redefinir seus dados de usuário e criar uma nova conta.
                </p>
                <p className="mt-2 text-sm text-red-400">
                    <strong>ATENÇÃO:</strong> Esta ação é irreversível e <strong>excluirá permanentemente todos os seus dados</strong>, incluindo dietas salvas e histórico de progresso.
                </p>
            </div>
            <p className="text-slate-400">
                Você tem certeza que deseja continuar?
            </p>
        </main>

        <footer className="p-4 border-t border-slate-700 flex flex-col-reverse sm:flex-row gap-4">
            <button 
                onClick={onClose}
                className="flex-1 bg-slate-600 hover:bg-slate-500 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
                Cancelar
            </button>
            <button 
                onClick={onConfirm}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
                Sim, excluir e redefinir
            </button>
        </footer>
      </div>
    </div>
  );
};

export default PasswordRecoveryModal;
