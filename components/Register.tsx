
import React, { useState } from 'react';

interface Props {
  onRegister: (fullName: string, email: string, password: string) => Promise<void>;
  onRegisterSuccess: () => void;
  onNavigateToLogin: () => void;
}

const Register: React.FC<Props> = ({ onRegister, onRegisterSuccess, onNavigateToLogin }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!fullName || !email || !password || !confirmPassword) {
      setError('Por favor, preencha todos os campos.');
      setIsLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      setIsLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      setIsLoading(false);
      return;
    }

    try {
      await onRegister(fullName, email, password);
      alert(`Cadastro realizado com sucesso, ${fullName}! Você será redirecionado para fazer o login.`);
      onRegisterSuccess();
    } catch (err: any) {
        setError(err.message || 'Ocorreu um erro ao criar a conta.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-700 animate-fade-in">
      <h2 className="text-2xl font-bold text-cyan-400 mb-6 text-center">Criar uma Conta</h2>
      <form onSubmit={handleRegister} className="space-y-6">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-slate-300 mb-2">Nome Completo</label>
          <input
            type="text"
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition"
            placeholder="Seu nome completo"
            required
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="reg-email" className="block text-sm font-medium text-slate-300 mb-2">E-mail</label>
          <input
            type="email"
            id="reg-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition"
            placeholder="seu@email.com"
            required
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="reg-password" className="block text-sm font-medium text-slate-300 mb-2">Senha</label>
          <input
            type="password"
            id="reg-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition"
            placeholder="•••••••• (mín. 6 caracteres)"
            required
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-2">Repetir Senha</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
          {isLoading ? 'Criando cadastro...' : 'Criar Cadastro'}
        </button>
      </form>
      <div className="mt-6 pt-6 border-t border-slate-700 text-center text-sm">
        <span className="text-slate-400">Já tem uma conta? </span>
        <button onClick={onNavigateToLogin} className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
          Faça o login
        </button>
      </div>
    </div>
  );
};

export default Register;
