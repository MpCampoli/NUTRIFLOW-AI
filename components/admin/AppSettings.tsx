import React, { useState, useEffect } from 'react';

interface AppSettingsData {
    planMonthly: number;
    planYearly: number;
    smtpServer: string;
    smtpPort: number | string;
    smtpUser: string;
    smtpPass: string;
    welcomeMessage: string;
    stripeEnabled: boolean;
}

const AppSettings: React.FC = () => {
    const [settings, setSettings] = useState<AppSettingsData>({
        planMonthly: 29.90,
        planYearly: 299.90,
        smtpServer: '',
        smtpPort: '',
        smtpUser: '',
        smtpPass: '',
        welcomeMessage: 'Bem-vindo(a) ao NutriFlow AI! Estamos felizes em ter você conosco.',
        stripeEnabled: true,
    });
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success'>('idle');

    useEffect(() => {
        // Carregar configurações salvas do localStorage
        try {
            const storedSettings = localStorage.getItem('nutriflow_app_settings');
            if (storedSettings) {
                setSettings(JSON.parse(storedSettings));
            }
        } catch (error) {
            console.error("Failed to load app settings:", error);
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setSettings(prev => ({ ...prev, [name]: checked }));
        } else {
            setSettings(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        try {
            localStorage.setItem('nutriflow_app_settings', JSON.stringify(settings));
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 3000); // Mensagem de sucesso some após 3s
        } catch (error) {
            console.error("Failed to save app settings:", error);
            alert("Ocorreu um erro ao salvar as configurações.");
        }
    };

    return (
        <div className="animate-fade-in">
            <h1 className="text-3xl font-bold text-cyan-400 mb-8">Configurações do Aplicativo</h1>
            <form onSubmit={handleSave} className="space-y-8">

                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <h2 className="text-xl font-bold text-white mb-4">Planos de Assinatura</h2>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="planMonthly" className="block text-sm font-medium text-slate-300 mb-2">Plano Mensal (R$)</label>
                            <input type="number" name="planMonthly" id="planMonthly" value={settings.planMonthly} onChange={handleChange} step="0.01" className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition" />
                        </div>
                        <div>
                            <label htmlFor="planYearly" className="block text-sm font-medium text-slate-300 mb-2">Plano Anual (R$)</label>
                            <input type="number" name="planYearly" id="planYearly" value={settings.planYearly} onChange={handleChange} step="0.01" className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition" />
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <h2 className="text-xl font-bold text-white mb-4">Configurações de E-mail (SMTP)</h2>
                    <p className="text-sm text-slate-400 mb-4">Configurações para o envio automático de e-mails (ex: confirmação de cadastro).</p>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="smtpServer" className="block text-sm font-medium text-slate-300 mb-2">Servidor SMTP</label>
                            <input type="text" name="smtpServer" id="smtpServer" value={settings.smtpServer} onChange={handleChange} placeholder="smtp.example.com" className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition" />
                        </div>
                        <div>
                            <label htmlFor="smtpPort" className="block text-sm font-medium text-slate-300 mb-2">Porta</label>
                            <input type="number" name="smtpPort" id="smtpPort" value={settings.smtpPort} onChange={handleChange} placeholder="587" className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition" />
                        </div>
                        <div>
                            <label htmlFor="smtpUser" className="block text-sm font-medium text-slate-300 mb-2">Usuário SMTP</label>
                            <input type="text" name="smtpUser" id="smtpUser" value={settings.smtpUser} onChange={handleChange} placeholder="seu_email@example.com" className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition" />
                        </div>
                        <div>
                            <label htmlFor="smtpPass" className="block text-sm font-medium text-slate-300 mb-2">Senha SMTP</label>
                            <input type="password" name="smtpPass" id="smtpPass" value={settings.smtpPass} onChange={handleChange} placeholder="••••••••" className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition" />
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <h2 className="text-xl font-bold text-white mb-4">Notificações Automáticas</h2>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="welcomeMessage" className="block text-sm font-medium text-slate-300 mb-2">Mensagem de Boas-vindas</label>
                            <textarea name="welcomeMessage" id="welcomeMessage" rows={3} value={settings.welcomeMessage} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition"></textarea>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <h2 className="text-xl font-bold text-white mb-4">Integrações de Pagamento</h2>
                    <div className="flex items-center justify-between bg-slate-700/50 p-4 rounded-lg">
                        <div>
                            <p className="font-semibold text-slate-100">Stripe</p>
                            <p className="text-sm text-slate-400">Gerenciamento de pagamentos e assinaturas.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" name="stripeEnabled" checked={settings.stripeEnabled} onChange={handleChange} className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-cyan-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                        </label>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        type="submit"
                        className="w-full md:w-auto bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105"
                    >
                        Salvar Configurações
                    </button>
                    {saveStatus === 'success' && (
                        <p className="text-green-400 animate-fade-in">Configurações salvas com sucesso!</p>
                    )}
                </div>

            </form>
        </div>
    );
};

export default AppSettings;
