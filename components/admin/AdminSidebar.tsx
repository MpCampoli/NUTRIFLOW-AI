import React from 'react';
import { LayoutDashboard, Users, DollarSign, Settings, BookOpen } from '../icons/AdminIcons';

type AdminView = 'dashboard' | 'users' | 'finance' | 'ebooks' | 'settings';

interface Props {
  currentView: AdminView;
  setView: (view: AdminView) => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  viewName: AdminView;
  currentView: AdminView;
  onClick: (view: AdminView) => void;
}> = ({ icon, label, viewName, currentView, onClick }) => {
  const isActive = currentView === viewName;
  return (
    <button
      onClick={() => onClick(viewName)}
      className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors ${
        isActive
          ? 'bg-cyan-500/10 text-cyan-400'
          : 'text-slate-400 hover:bg-slate-700 hover:text-white'
      }`}
    >
      {icon}
      <span className="ml-3 font-semibold">{label}</span>
    </button>
  );
};

const AdminSidebar: React.FC<Props> = ({ currentView, setView }) => {
  return (
    <aside className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
      <nav className="space-y-2">
        <NavItem
          icon={<LayoutDashboard className="w-6 h-6" />}
          label="Dashboard"
          viewName="dashboard"
          currentView={currentView}
          onClick={setView}
        />
        <NavItem
          icon={<Users className="w-6 h-6" />}
          label="Usuários"
          viewName="users"
          currentView={currentView}
          onClick={setView}
        />
        <NavItem
          icon={<DollarSign className="w-6 h-6" />}
          label="Financeiro"
          viewName="finance"
          currentView={currentView}
          onClick={setView}
        />
        <NavItem
          icon={<BookOpen className="w-6 h-6" />}
          label="E-books & Arquivos"
          viewName="ebooks"
          currentView={currentView}
          onClick={setView}
        />
        <NavItem
          icon={<Settings className="w-6 h-6" />}
          label="Configurações"
          viewName="settings"
          currentView={currentView}
          onClick={setView}
        />
      </nav>
    </aside>
  );
};

export default AdminSidebar;