import React, { useState } from 'react';
import { User } from '../types';

interface Props {
  onRegisterSuccess: () => void;
  onNavigateToLogin: () => void;
}

const Register: React.FC<Props> = ({ onRegisterSuccess, onNavigateToLogin }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName || !email || !password || !confirmPassword) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    try {
      const users: User[] = JSON.parse(localStorage.getItem('nutriflow_users') || '[]');
      const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (existingUser) {
        setError('Este e-mail já está em uso.');
        return;
      }

      const newUser: User = {
        id: new Date().toISOString(),
        fullName,
        email,
        passwordHash: password, // Storing plain text for simulation
      };

      users.push(newUser);
      localStorage.setItem('nutriflow_users', JSON.stringify(users));
      
      alert('Cadastro realizado com sucesso! Por favor, faça o login.');
      onRegisterSuccess();

    } catch (err) {
      setError('Ocorreu um erro ao criar a conta. Tente novamente.');
      console.error("Registration error:", err);
    }
  };

  return (
    <div className="bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-700 animate-fade-in">
      <h2 className="text-2xl font-bold text-cyan-400 mb-6 text-center">Criar Nova Conta</h2>
      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label htmlFor="fullName" a-label="Nome completo" className="block text-sm font-medium text-slate-300 mb-2">Nome Completo</label>
          <input type="text" id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition" required />
        </div>
        <div>
          <label htmlFor="reg-email" a-label="E-mail" className="block text-sm font-medium text-slate-300 mb-2">E-mail</label>
          <input type="email" id="reg-email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition" required />
        </div>
        <div>
          <label htmlFor="reg-password" a-label="Senha" className="block text-sm font-medium text-slate-300 mb-2">Senha</label>
          <input type="password" id="reg-password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition" required />
        </div>
        <div>
          <label htmlFor="confirmPassword" a-label="Confirmar senha" className="block text-sm font-medium text-slate-300 mb-2">Confirmar Senha</label>
          <input type="password" id="confirmPassword" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition" required />
        </div>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105 mt-4"
        >
          Cadastrar
        </button>
      </form>
      <div className="mt-6 pt-4 border-t border-slate-700 text-center text-sm">
        <span className="text-slate-400">Já tem uma conta? </span>
        <button onClick={onNavigateToLogin} className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
          Faça o login
        </button>
      </div>
    </div>
  );
};

export default Register;
