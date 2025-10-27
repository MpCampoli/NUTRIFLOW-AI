
import React from 'react';
import { ArrowLeft } from './icons/ArrowLeft';
import { NotificationSettings } from '../types';
import { Bell, Droplets } from 'lucide-react';

interface Props {
    settings: NotificationSettings;
    onSettingsChange: (newSettings: NotificationSettings) => void;
    onBack: () => void;
}

const commonMeals = ['Café da Manhã', 'Lanche da Manhã', 'Almoço', 'Lanche da Tarde', 'Jantar', 'Ceia', 'Pré-treino', 'Pós-treino'];
const offsetOptions = [
    { label: 'Na hora', value: 0 },
    { label: '5 min antes', value: 5 },
    { label: '10 min antes', value: 10 },
    { label: '15 min antes', value: 15 },
    { label: '30 min antes', value: 30 },
];


const NotificationSettingsComponent: React.FC<Props> = ({ settings, onSettingsChange, onBack }) => {
    
    const handleMealSettingChange = (mealName: string, key: 'enabled' | 'offset', value: boolean | number) => {
        onSettingsChange({
            ...settings,
            mealReminderSettings: {
                ...settings.mealReminderSettings,
                [mealName]: {
                    ...(settings.mealReminderSettings[mealName] || { enabled: false, offset: 0 }),
                    [key]: value
                }
            }
        });
    };

    const handleHydrationToggle = () => {
        onSettingsChange({ ...settings, hydrationReminders: !settings.hydrationReminders });
    };

    const handleHydrationFrequencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onSettingsChange({ ...settings, hydrationFrequency: Number(e.target.value) });
    };

    return (
        <div className="bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-700 animate-fade-in relative">
            <button onClick={onBack} className="absolute top-6 left-6 text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-2">
                <ArrowLeft className="w-5 h-5" />
                Voltar ao Perfil
            </button>
            <h2 className="text-3xl font-bold text-cyan-400 mb-8 text-center pt-8">Configurações de Notificação</h2>

            <div className="space-y-6">
                <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700">
                    <h3 className="text-xl font-bold text-white mb-4">Lembretes de Refeição</h3>
                    <p className="text-sm text-slate-400 mb-6">Ative e configure alertas para cada uma das suas refeições planejadas.</p>
                    <div className="space-y-5">
                        {commonMeals.map(mealName => {
                            const setting = settings.mealReminderSettings?.[mealName] || { enabled: false, offset: 0 };
                            return (
                                <div key={mealName} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-slate-800 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Bell className={`w-5 h-5 transition-colors ${setting.enabled ? 'text-cyan-400' : 'text-slate-500'}`} />
                                            <span className={`font-semibold transition-colors ${setting.enabled ? 'text-slate-100' : 'text-slate-400'}`}>{mealName}</span>
                                        </div>
                                         <label className="relative inline-flex items-center cursor-pointer sm:hidden">
                                            <input type="checkbox" checked={setting.enabled} onChange={() => handleMealSettingChange(mealName, 'enabled', !setting.enabled)} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                                        </label>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <select 
                                            value={setting.offset} 
                                            onChange={(e) => handleMealSettingChange(mealName, 'offset', Number(e.target.value))}
                                            disabled={!setting.enabled}
                                            className="w-full sm:w-auto bg-slate-700 border border-slate-600 rounded-lg p-2 text-sm focus:ring-2 focus:ring-cyan-500 outline-none transition disabled:opacity-50"
                                        >
                                            {offsetOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                        </select>
                                        <label className="relative hidden sm:inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={setting.enabled} onChange={() => handleMealSettingChange(mealName, 'enabled', !setting.enabled)} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                                        </label>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-4">
                            <Droplets className="w-6 h-6 text-blue-400" />
                            <div>
                                <h3 className="font-semibold text-lg text-white">Lembretes de Hidratação</h3>
                                <p className="text-sm text-slate-400">Receba alertas periódicos para beber água.</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={settings.hydrationReminders} onChange={handleHydrationToggle} className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-cyan-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                        </label>
                    </div>
                    {settings.hydrationReminders && (
                        <div className="mt-4 pt-4 border-t border-slate-700 animate-fade-in">
                            <label htmlFor="hydrationFrequency" className="block text-sm font-medium text-slate-300 mb-2">Frequência dos lembretes</label>
                            <select 
                                id="hydrationFrequency"
                                name="hydrationFrequency"
                                value={settings.hydrationFrequency} 
                                onChange={handleHydrationFrequencyChange}
                                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition"
                            >
                                <option value="30">A cada 30 minutos</option>
                                <option value="60">A cada 1 hora</option>
                                <option value="90">A cada 1 hora e 30 minutos</option>
                                <option value="120">A cada 2 horas</option>
                            </select>
                        </div>
                    )}
                </div>
            </div>
             <p className="text-xs text-slate-500 mt-8 text-center">As notificações funcionam melhor quando o aplicativo está aberto em uma aba do navegador.</p>
        </div>
    );
};

export default NotificationSettingsComponent;
