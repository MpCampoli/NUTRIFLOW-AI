
import React, { useState, useEffect } from 'react';
import { User } from '../types';

interface Props {
  onLoginSuccess: (user: User) => void;
  onNavigateToRegister: () => void;
  onNavigateToRecovery: () => void;
}

const Login: React.FC<Props> = ({ onLoginSuccess, onNavigateToRegister, onNavigateToRecovery }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('nutriflow_remembered_user');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);


  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    try {
      const users: User[] = JSON.parse(localStorage.getItem('nutriflow_users') || '[]');
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (user && user.passwordHash === password) { // Simple check for simulation
        if (rememberMe) {
            localStorage.setItem('nutriflow_remembered_user', user.email);
        } else {
            localStorage.removeItem('nutriflow_remembered_user');
        }
        onLoginSuccess(user);
      } else {
        setError('E-mail ou senha inválidos.');
      }
    } catch (err) {
      setError('Ocorreu um erro. Por favor, tente novamente.');
      console.error("Login error:", err);
    }
  };

  return (
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
          />
        </div>
        <div>
          <label htmlFor="password" a-label="Senha" className="block text-sm font-medium text-slate-300 mb-2">Senha</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition"
            placeholder="••••••••"
            required
          />
        </div>

        <div className="flex items-center justify-between">
            <div className="flex items-center">
                <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-500 bg-slate-700 text-cyan-600 focus:ring-cyan-500"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-300">
                    Lembrar-me
                </label>
            </div>

            <div className="text-sm">
                <button type="button" onClick={onNavigateToRecovery} className="font-medium text-slate-400 hover:text-cyan-400 transition-colors">
                Esqueceu sua senha?
                </button>
            </div>
        </div>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105"
        >
          Entrar
        </button>
      </form>
      <div className="mt-6 pt-6 border-t border-slate-700 text-center text-sm">
        <span className="text-slate-400">Não tem uma conta? </span>
        <button onClick={onNavigateToRegister} className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
          Crie uma agora
        </button>
      </div>
    </div>
  );
};

export default Login;