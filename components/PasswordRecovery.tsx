import React, { useState } from 'react';

interface Props {
  onNavigateToLogin: () => void;
}

const PasswordRecovery: React.FC<Props> = ({ onNavigateToLogin }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const handleSendLink = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulation: In a real app, this would trigger a backend service.
    setMessage('Se este e-mail estiver cadastrado, um link para redefinir sua senha foi enviado.');
  };

  return (
    <div className="bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-700 animate-fade-in">
      <h2 className="text-2xl font-bold text-cyan-400 mb-6 text-center">Recuperar Senha</h2>
      {message ? (
        <div className="text-center">
            <p className="text-green-400 mb-6">{message}</p>
            <button onClick={onNavigateToLogin} className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
                Voltar para o Login
            </button>
        </div>
      ) : (
        <>
            <p className="text-slate-400 text-center mb-6">Digite seu e-mail e enviaremos um link para você voltar a acessar sua conta.</p>
            <form onSubmit={handleSendLink} className="space-y-6">
                <div>
                <label htmlFor="rec-email" a-label="E-mail" className="block text-sm font-medium text-slate-300 mb-2">E-mail</label>
                <input
                    type="email"
                    id="rec-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition"
                    placeholder="seu@email.com"
                    required
                />
                </div>
                <button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105"
                >
                Enviar Link de Redefinição
                </button>
            </form>
            <div className="mt-6 text-center text-sm">
                <button onClick={onNavigateToLogin} className="text-slate-400 hover:text-cyan-400 transition-colors">
                Lembrou a senha? Voltar para o Login
                </button>
            </div>
        </>
      )}
    </div>
  );
};

export default PasswordRecovery;
