
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft } from './icons/ArrowLeft';
import { ProfileIcon, CameraIcon, BookOpen } from './icons/AppBarIcons';
import { User } from '../types';
import { LogOut } from './icons/Actions';
import { Bell } from 'lucide-react'; // Assuming lucide-react is installed

interface Props {
  user: User;
  onBack: () => void;
  onSave: (updatedData: Partial<User>) => void;
  onLogout: () => void;
  onNavigateToNotificationSettings: () => void;
  onNavigateToUserFiles: () => void;
}

const UserProfile: React.FC<Props> = ({ user, onBack, onSave, onLogout, onNavigateToNotificationSettings, onNavigateToUserFiles }) => {
  const [profileData, setProfileData] = useState<User>(user);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [completion, setCompletion] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const calculateProfileCompletion = (pData: User) => {
    const fields = [
      pData.profilePicture,
      pData.cpf,
      pData.address,
      pData.birthDate,
      pData.gender,
      pData.phoneNumber,
      pData.weight,
      pData.height,
      pData.goals,
    ];

    const filledCount = fields.filter(field => {
      if (field === null || field === undefined) return false;
      if (typeof field === 'string' && field.trim() === '') return false;
      if (typeof field === 'number' && (isNaN(field) || field <= 0)) return false;
      return true;
    }).length;

    return Math.round((filledCount / fields.length) * 100);
  };

  useEffect(() => {
    setProfileData(user);
    setCompletion(calculateProfileCompletion(user));
  }, [user]);

  useEffect(() => {
    setCompletion(calculateProfileCompletion(profileData));
  }, [profileData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const isNumberField = ['weight', 'height'].includes(name);
    setProfileData({ ...profileData, [name]: isNumberField ? (value ? parseFloat(value) : undefined) : value });
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData({ ...profileData, profilePicture: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBiometricToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData(prev => ({ ...prev, biometricsEnabled: e.target.checked }));
  };

  const handleSave = () => {
    if (!profileData.fullName || !profileData.email) {
      setError('Nome completo e E-mail são obrigatórios.');
      setSuccessMessage(null);
      return;
    }
    setError(null);
    try {
      onSave(profileData);
      setSuccessMessage('Dados do perfil atualizados com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Não foi possível salvar os dados. Por favor, tente novamente.');
      console.error("Failed to save user profile:", err);
    }
  };

  return (
    <div className="bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-700 animate-fade-in relative">
      <button onClick={onBack} className="absolute top-6 left-6 text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-2">
        <ArrowLeft className="w-5 h-5" />
        Voltar
      </button>
      <button onClick={onLogout} title="Sair" className="absolute top-6 right-6 text-slate-400 hover:text-red-400 transition-colors p-2 rounded-full hover:bg-slate-700">
        <LogOut className="w-5 h-5" />
      </button>
      <h2 className="text-3xl font-bold text-cyan-400 mb-8 text-center pt-8">Meu Perfil</h2>

      <div className="space-y-8">
        {/* Profile Picture and Completion */}
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="flex-shrink-0">
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="relative w-32 h-32 rounded-full bg-slate-700 border-2 border-slate-600 flex items-center justify-center group"
              title="Alterar foto de perfil"
            >
              {profileData.profilePicture ? (
                <img src={profileData.profilePicture} alt="Foto de Perfil" className="w-full h-full rounded-full object-cover" />
              ) : (
                <ProfileIcon className="w-16 h-16 text-slate-500" />
              )}
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <CameraIcon className="w-8 h-8 text-white" />
              </div>
            </button>
          </div>
          <div className="w-full text-center sm:text-left">
            <h3 className="text-2xl font-bold text-white">{profileData.fullName}</h3>
            <p className="text-slate-400">{profileData.email}</p>
            <div className="mt-4">
              <label className="text-sm font-medium text-slate-300 mb-2 block">Perfil Completo: {completion}%</label>
              <div className="w-full bg-slate-700 rounded-full h-2.5">
                <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${completion}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Sections */}
        <div className="space-y-6">
          {/* Settings */}
           <div className="border-t border-slate-700 pt-6">
                <h3 className="text-lg font-bold text-slate-200 mb-4">Configurações</h3>
                <div className="space-y-3">
                    <button onClick={onNavigateToNotificationSettings} className="w-full flex items-center justify-between text-left p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors">
                        <span className="font-semibold text-slate-100">Configurações de Notificação</span>
                        <Bell className="w-5 h-5 text-slate-400" />
                    </button>
                    <button onClick={onNavigateToUserFiles} className="w-full flex items-center justify-between text-left p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors">
                        <span className="font-semibold text-slate-100">E-books & Arquivos</span>
                        <BookOpen className="w-5 h-5 text-slate-400" />
                    </button>
                </div>
           </div>
          {/* Personal Info */}
          <div className="border-t border-slate-700 pt-6">
            <h3 className="text-lg font-bold text-slate-200 mb-4">Informações Pessoais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-slate-300 mb-2">Nome Completo <span className="text-red-400">*</span></label>
                <input type="text" name="fullName" id="fullName" value={profileData.fullName || ''} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3" required />
              </div>
              <div>
                <label htmlFor="cpf" className="block text-sm font-medium text-slate-300 mb-2">CPF</label>
                <input type="text" name="cpf" id="cpf" value={profileData.cpf || ''} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3" />
              </div>
              <div>
                <label htmlFor="birthDate" className="block text-sm font-medium text-slate-300 mb-2">Data de Nascimento</label>
                <input type="date" name="birthDate" id="birthDate" value={profileData.birthDate || ''} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3" />
              </div>
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-slate-300 mb-2">Gênero</label>
                <select name="gender" id="gender" value={profileData.gender || ''} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3">
                  <option value="">Prefiro não informar</option>
                  <option value="male">Masculino</option>
                  <option value="female">Feminino</option>
                  <option value="other">Outro</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="border-t border-slate-700 pt-6">
            <h3 className="text-lg font-bold text-slate-200 mb-4">Contato</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">E-mail <span className="text-red-400">*</span></label>
                <input type="email" name="email" id="email" value={profileData.email || ''} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3" required />
              </div>
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-slate-300 mb-2">Telefone</label>
                <input type="tel" name="phoneNumber" id="phoneNumber" value={profileData.phoneNumber || ''} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3" />
              </div>
               <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-slate-300 mb-2">Endereço</label>
                <input type="text" name="address" id="address" value={profileData.address || ''} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3" />
              </div>
            </div>
          </div>

          {/* Physical Details */}
          <div className="border-t border-slate-700 pt-6">
            <h3 className="text-lg font-bold text-slate-200 mb-4">Detalhes Físicos e Metas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="weight" className="block text-sm font-medium text-slate-300 mb-2">Peso (kg)</label>
                  <input type="number" name="weight" id="weight" value={profileData.weight || ''} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3" />
                </div>
                <div>
                  <label htmlFor="height" className="block text-sm font-medium text-slate-300 mb-2">Altura (cm)</label>
                  <input type="number" name="height" id="height" value={profileData.height || ''} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3" />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="goals" className="block text-sm font-medium text-slate-300 mb-2">Meus Objetivos</label>
                  <textarea name="goals" id="goals" value={profileData.goals || ''} onChange={handleChange} rows={3} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3" placeholder="Ex: Perder 5kg, melhorar performance no treino, ter mais disposição..."></textarea>
                </div>
            </div>
          </div>

          {/* Security */}
          <div className="border-t border-slate-700 pt-6">
            <h3 className="text-lg font-bold text-slate-200 mb-4">Segurança</h3>
            <div className="flex items-center justify-between bg-slate-700/50 p-4 rounded-lg">
              <div>
                <p className="font-semibold text-slate-100">Acesso com biometria</p>
                <p className="text-sm text-slate-400">Use seu reconhecimento facial para entrar mais rápido.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={!!profileData.biometricsEnabled} onChange={handleBiometricToggle} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-cyan-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
              </label>
            </div>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm text-center -mb-2">{error}</p>}
        {successMessage && <p className="text-green-400 text-sm text-center -mb-2">{successMessage}</p>}

        <button
          onClick={handleSave}
          className="w-full mt-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105"
        >
          Salvar Informações
        </button>
      </div>
    </div>
  );
};

export default UserProfile;
