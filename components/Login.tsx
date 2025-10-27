
import React, { useState } from 'react';
import PasswordRecoveryModal from './PasswordRecoveryModal';

interface Props {
  onLogin: (email: string, password: string) => Promise<void>;
  onNavigateToRegister: () => void;
}

const Login: React.FC<Props> = ({ onLogin, onNavigateToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      setIsLoading(false);
      return;
    }

    try {
      await onLogin(email, password);
      // Success, App.tsx will handle the navigation
    } catch (err: any) {
        setError(err.message || 'Ocorreu um erro ao fazer o login.');
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleAccountReset = () => {
    try {
        // This is the core logic: remove the user data from local storage.
        localStorage.removeItem('nutriflow_users');
        setIsRecoveryModalOpen(false);
        alert('Dados de acesso removidos. Você será redirecionado para criar uma nova conta.');
        onNavigateToRegister();
    } catch (e) {
        console.error("Failed to clear user data", e);
        alert("Ocorreu um erro ao tentar redefinir os dados.");
    }
  };

  return (
    <>
    <div className="bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-700 animate-fade-in">
      <h2 className="text-2xl font-bold text-cyan-400 mb-6 text-center">Acessar sua Conta</h2>
      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">E-mail</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition"
            placeholder="seu@email.com"
            required
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">Senha</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition"
            placeholder="••••••••"
            required
            disabled={isLoading}
          />
        </div>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      
      <div className="text-center mt-4">
        <button 
            type="button" 
            onClick={() => setIsRecoveryModalOpen(true)}
            className="text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
         >
            Esqueceu a senha?
        </button>
      </div>

      <div className="mt-6 pt-6 border-t border-slate-700 text-center text-sm">
        <span className="text-slate-400">Não tem uma conta? </span>
        <button onClick={onNavigateToRegister} className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
          Criar Cadastro
        </button>
      </div>
    </div>
    <PasswordRecoveryModal 
        isOpen={isRecoveryModalOpen}
        onClose={() => setIsRecoveryModalOpen(false)}
        onConfirm={handleAccountReset}
    />
    </>
  );
};

export default Login;
