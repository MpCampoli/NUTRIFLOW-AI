import React, { useState, useEffect } from 'react';
import { User, FinancialRecord } from '../../types';
import { Users, DollarSign, BarChart, FileText, RefreshCw } from '../icons/AdminIcons';
// Fix: Removed Firebase imports as it's no longer used.
// import { db } from '../../firebaseConfig';
// import { collection, getDocs } from 'firebase/firestore';


interface InfoCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    color: string;
}

const InfoCard: React.FC<InfoCardProps> = ({ title, value, icon, color }) => (
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex items-center gap-4">
        <div className={`p-3 rounded-full ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-slate-400">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    </div>
);


const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeSubscribers: 0,
        revenue: 0,
    });
    const [isRefreshing, setIsRefreshing] = useState(false);

    const loadDashboardData = () => {
        setIsRefreshing(true);
        try {
            // Fix: Fetch users from localStorage instead of Firestore
            const usersData: User[] = JSON.parse(localStorage.getItem('nutriflow_users') || '[]');
            const activeSubscribersCount = usersData.filter(u => u.status === 'active' && u.paymentStatus === 'paid' && u.role !== 'admin').length;

            // Fetch financials from localStorage (consistent with Financials page)
            const financialRecords: FinancialRecord[] = JSON.parse(localStorage.getItem('nutriflow_financials') || '[]');
            const calculatedRevenue = financialRecords
                .filter(record => record.status === 'Aprovado')
                .reduce((total, record) => total + record.amount, 0);

            setStats({
                totalUsers: usersData.length,
                activeSubscribers: activeSubscribersCount,
                revenue: calculatedRevenue,
            });

        } catch (error) {
            console.error("Failed to load dashboard data:", error);
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
    }, []);

    const handleRefresh = () => {
        loadDashboardData();
    };

    return (
        <div className="animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold text-cyan-400">Dashboard</h1>
                 <button 
                    onClick={handleRefresh} 
                    disabled={isRefreshing}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                    title="Atualizar dados do dashboard"
                >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span>{isRefreshing ? 'Atualizando...' : 'Atualizar'}</span>
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                <InfoCard 
                    title="Total de Usuários" 
                    value={stats.totalUsers.toString()} 
                    icon={<Users className="w-7 h-7 text-slate-900"/>}
                    color="bg-cyan-400"
                />
                 <InfoCard 
                    title="Receita (Aprovada)" 
                    value={stats.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} 
                    icon={<DollarSign className="w-7 h-7 text-slate-900"/>}
                    color="bg-green-400"
                />
                 <InfoCard 
                    title="Assinantes Ativos" 
                    value={stats.activeSubscribers.toString()} 
                    icon={<Users className="w-7 h-7 text-slate-900"/>}
                    color="bg-purple-400"
                />
                 <InfoCard 
                    title="Cancelamentos" 
                    value="0" 
                    icon={<Users className="w-7 h-7 text-slate-900"/>}
                    color="bg-red-400"
                />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <BarChart className="w-6 h-6 text-cyan-400"/>
                        Crescimento de Usuários
                    </h2>
                     <div className="h-64 flex items-end justify-between p-4 bg-slate-900/50 rounded-lg">
                        <div className="w-1/5 h-[30%] bg-cyan-500 rounded-t-md" title="Mês 1"></div>
                        <div className="w-1/5 h-[50%] bg-cyan-500 rounded-t-md" title="Mês 2"></div>
                        <div className="w-1/5 h-[40%] bg-cyan-500 rounded-t-md" title="Mês 3"></div>
                        <div className="w-1/5 h-[70%] bg-cyan-500 rounded-t-md" title="Mês 4"></div>
                        <div className="w-1/5 h-[85%] bg-cyan-500 rounded-t-md" title="Mês 5"></div>
                    </div>
                    <p className="text-sm text-slate-500 mt-2 text-center">Dados de crescimento simulados.</p>
                </div>
                 <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                     <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-green-400"/>
                        Logs de Atividade Recentes
                    </h2>
                     <div className="h-64 overflow-y-auto p-4 bg-slate-900/50 rounded-lg text-sm space-y-2">
                        <p className="text-slate-400"><span className="font-mono text-cyan-400">[LOG]</span> Admin alterou status do usuário user@example.com para 'suspenso'.</p>
                         <p className="text-slate-400"><span className="font-mono text-green-400">[LOG]</span> Pagamento de R$29,90 recebido de user2@example.com.</p>
                         <p className="text-slate-400"><span className="font-mono text-yellow-400">[LOG]</span> Admin acessou o painel financeiro.</p>
                         <p className="text-slate-400"><span className="font-mono text-red-400">[LOG]</span> Falha na tentativa de login para o email 'test@test.com'.</p>
                         <p className="text-slate-400"><span className="font-mono text-cyan-400">[LOG]</span> Admin exportou relatório de usuários.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;