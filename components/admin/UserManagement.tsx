import React, { useState, useEffect, useRef } from 'react';
import { User } from '../../types';
import { Trash2 } from '../icons/EditorIcons';
import { Settings, DollarSign, CheckCircle, XCircle, RefreshCw } from '../icons/AdminIcons';
import { MessageSquareText } from '../icons/Actions';
// Fix: Removed Firebase imports as it's no longer used.
// import { db } from '../../firebaseConfig';
// import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';


interface Props {
    adminUser: User;
}

const UserManagement: React.FC<Props> = ({ adminUser }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended' | 'pending_confirmation'>('all');
    const [filterPayment, setFilterPayment] = useState<'all' | 'paid' | 'unpaid'>('all');
    const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const menuRef = useRef<HTMLDivElement>(null);

    // Fix: Replaced Firestore listener with localStorage data fetching.
    useEffect(() => {
        setIsLoading(true);
        try {
            const storedUsers = localStorage.getItem('nutriflow_users');
            const usersData: User[] = storedUsers ? JSON.parse(storedUsers) : [];
            usersData.sort((a, b) => a.fullName.localeCompare(b.fullName));
            setUsers(usersData);
        } catch (error) {
            console.error("Erro ao buscar usuários do localStorage:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Efeito para fechar o menu ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setActiveActionMenu(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuRef]);

    const logAction = (action: string, targetUserEmail: string) => {
        // Lógica de log (pode ser movida para o Firebase Functions no futuro)
        console.log(`[ADMIN LOG] Admin: ${adminUser.email}, Action: ${action}, Target: ${targetUserEmail}`);
    };

    // Fix: Rewrote updateUser to use localStorage.
    const handleUpdateUser = (userId: string, data: Partial<User>) => {
        try {
            const storedUsers = localStorage.getItem('nutriflow_users');
            let usersData: User[] = storedUsers ? JSON.parse(storedUsers) : [];
            
            const userIndex = usersData.findIndex(u => u.id === userId);
            if (userIndex > -1) {
                usersData[userIndex] = { ...usersData[userIndex], ...data };
                localStorage.setItem('nutriflow_users', JSON.stringify(usersData));
                // also update local state to reflect changes immediately
                setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, ...data } : u));
            }
        } catch (error) {
            console.error("Erro ao atualizar usuário:", error);
            alert("Não foi possível atualizar o usuário.");
        }
    };
    
    const handleToggleStatus = (userId: string) => {
        const user = users.find(u => u.id === userId);
        if (!user || !user.status) return;
        
        let newStatus: User['status'] = user.status;
        let actionLog = '';
        let sendActivationEmail = false;

        if (user.status === 'pending_confirmation') {
            newStatus = 'active';
            actionLog = `Ativou usuário`;
            sendActivationEmail = true;
        } else if (user.status === 'active') {
            newStatus = 'suspended';
            actionLog = `Bloqueou usuário`;
        } else if (user.status === 'suspended') {
            newStatus = 'active';
            actionLog = `Desbloqueou usuário`;
        }
        
        logAction(actionLog, user.email);
        handleUpdateUser(userId, { status: newStatus });
        
        if (sendActivationEmail) {
            console.log(`--- SIMULAÇÃO: E-MAIL DE ATIVAÇÃO PARA ${user.email} ---`);
            alert(`Usuário ${user.email} ativado! (Simulação: E-mail de notificação de ativação enviado.)`);
        }

        setActiveActionMenu(null);
    };

    const handleTogglePayment = (userId: string) => {
        const user = users.find(u => u.id === userId);
        if (!user) return;
        const newPaymentStatus = user.paymentStatus === 'paid' ? 'unpaid' : 'paid';
        logAction(`Marcou pagamento como '${newPaymentStatus}'`, user.email);
        handleUpdateUser(userId, { paymentStatus: newPaymentStatus });
        setActiveActionMenu(null);
    };


    // Fix: Rewrote deleteUser to use localStorage.
    const handleDeleteUser = (userId: string) => {
        setActiveActionMenu(null);
        const userToDelete = users.find(u => u.id === userId);
        if (userToDelete && window.confirm(`Tem certeza que deseja excluir o usuário ${userToDelete.email}? Esta ação não pode ser desfeita.`)) {
             if (userToDelete.role === 'admin') {
                alert("Não é possível excluir uma conta de administrador.");
                return;
            }
            logAction('Excluiu usuário', userToDelete.email);
            try {
                const storedUsers = localStorage.getItem('nutriflow_users');
                let usersData: User[] = storedUsers ? JSON.parse(storedUsers) : [];
                usersData = usersData.filter(u => u.id !== userId);
                localStorage.setItem('nutriflow_users', JSON.stringify(usersData));
                setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
            } catch (error) {
                console.error("Erro ao deletar usuário:", error);
                alert("Não foi possível excluir o usuário.");
            }
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
        const matchesPayment = filterPayment === 'all' || user.paymentStatus === filterPayment;
        return matchesSearch && matchesStatus && matchesPayment;
    });

    const getStatusChip = (status?: 'active' | 'suspended' | 'pending_confirmation') => {
        switch (status) {
            case 'active':
                return <span className="px-2 py-1 text-xs font-semibold text-green-300 bg-green-500/20 rounded-full">Ativo</span>;
            case 'suspended':
                return <span className="px-2 py-1 text-xs font-semibold text-red-300 bg-red-500/20 rounded-full">Bloqueado</span>;
            case 'pending_confirmation':
                return <span className="px-2 py-1 text-xs font-semibold text-yellow-300 bg-yellow-500/20 rounded-full">Pendente</span>;
            default:
                return <span className="px-2 py-1 text-xs font-semibold text-slate-400 bg-slate-600/50 rounded-full">Indefinido</span>;
        }
    };

    const getPaymentStatusChip = (status?: 'paid' | 'unpaid') => {
        switch (status) {
            case 'paid':
                return <span className="px-2 py-1 text-xs font-semibold text-green-300 bg-green-500/20 rounded-full">Pago</span>;
            case 'unpaid':
                return <span className="px-2 py-1 text-xs font-semibold text-orange-300 bg-orange-500/20 rounded-full">Não Pago</span>;
            default:
                return <span className="px-2 py-1 text-xs font-semibold text-slate-400 bg-slate-600/50 rounded-full">N/D</span>;
        }
    };


    return (
        <div className="animate-fade-in">
            <h1 className="text-3xl font-bold text-cyan-400 mb-8">Gerenciamento de Usuários</h1>

            <div className="mb-6 flex flex-col md:flex-row gap-4 items-center">
                <input
                    type="text"
                    placeholder="Buscar por nome ou e-mail..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-grow w-full md:w-auto bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition"
                />
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="bg-slate-700 w-full md:w-auto border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition"
                >
                    <option value="all">Todos os Status</option>
                    <option value="active">Ativo</option>
                    <option value="suspended">Bloqueado</option>
                    <option value="pending_confirmation">Pendente</option>
                </select>
                 <select
                    value={filterPayment}
                    onChange={(e) => setFilterPayment(e.target.value as any)}
                    className="bg-slate-700 w-full md:w-auto border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition"
                >
                    <option value="all">Pagamento</option>
                    <option value="paid">Pago</option>
                    <option value="unpaid">Não Pago</option>
                </select>
            </div>

            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900/50">
                            <tr>
                                <th className="p-4 font-semibold">Nome</th>
                                <th className="p-4 font-semibold">E-mail</th>
                                <th className="p-4 font-semibold">Status</th>
                                <th className="p-4 font-semibold">Pagamento</th>
                                <th className="p-4 font-semibold text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {isLoading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-500">Carregando usuários...</td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-500">Nenhum usuário encontrado.</td></tr>
                            ) : (
                                filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-slate-700/50">
                                    <td className="p-4">{user.fullName}</td>
                                    <td className="p-4 text-slate-400">{user.email}</td>
                                    <td className="p-4">{getStatusChip(user.status)}</td>
                                    <td className="p-4">{getPaymentStatusChip(user.paymentStatus)}</td>
                                    <td className="p-4 text-center">
                                       <div className="relative inline-block" ref={menuRef}>
                                            <button 
                                                onClick={() => setActiveActionMenu(activeActionMenu === user.id ? null : user.id)}
                                                className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-600 transition-colors"
                                            >
                                                <Settings className="w-5 h-5" />
                                            </button>
                                            {activeActionMenu === user.id && (
                                                <div className="absolute right-0 mt-2 w-56 bg-slate-900 rounded-md shadow-lg z-10 border border-slate-700 text-left py-1">
                                                    {user.status === 'pending_confirmation' && (
                                                        <button onClick={() => handleToggleStatus(user.id)} className="flex items-center gap-3 w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">
                                                            <CheckCircle className="w-4 h-4 text-green-400" />
                                                            <span>Ativar Usuário</span>
                                                        </button>
                                                    )}
                                                    {user.status === 'active' && (
                                                        <button onClick={() => handleToggleStatus(user.id)} disabled={user.role === 'admin'} className="flex items-center gap-3 w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 disabled:opacity-50">
                                                            <XCircle className="w-4 h-4 text-red-400" />
                                                            <span>Bloquear Usuário</span>
                                                        </button>
                                                    )}
                                                    {user.status === 'suspended' && (
                                                        <button onClick={() => handleToggleStatus(user.id)} className="flex items-center gap-3 w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">
                                                            <CheckCircle className="w-4 h-4 text-green-400" />
                                                            <span>Desbloquear Usuário</span>
                                                        </button>
                                                    )}
                                                    <button onClick={() => handleTogglePayment(user.id)} className="flex items-center gap-3 w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">
                                                        <DollarSign className="w-4 h-4 text-yellow-400" />
                                                        <span>{user.paymentStatus === 'paid' ? 'Marcar Não Pago' : 'Marcar Pago'}</span>
                                                    </button>
                                                    <button onClick={() => alert(`Simulação de envio de e-mail para ${user.email}.`)} className="flex items-center gap-3 w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">
                                                        <MessageSquareText className="w-4 h-4 text-cyan-400" />
                                                        <span>Enviar Mensagem</span>
                                                    </button>
                                                    <div className="my-1 h-px bg-slate-700"></div>
                                                    <button onClick={() => handleDeleteUser(user.id)} disabled={user.role === 'admin'} className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-50">
                                                        <Trash2 className="w-4 h-4" />
                                                        <span>Excluir Usuário</span>
                                                    </button>
                                                </div>
                                            )}
                                       </div>
                                    </td>
                                </tr>
                            )))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;
