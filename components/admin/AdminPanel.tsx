import React, { useState } from 'react';
import { User } from '../../types';
import AdminSidebar from './AdminSidebar';
import AdminDashboard from './AdminDashboard';
import UserManagement from './UserManagement';
import Financials from './Financials';
import AppSettings from './AppSettings';
import EbooksAndFiles from './EbooksAndFiles';

type AdminView = 'dashboard' | 'users' | 'finance' | 'ebooks' | 'settings';

interface Props {
  onBack: () => void;
  adminUser: User;
}

const AdminPanel: React.FC<Props> = ({ adminUser }) => {
  const [view, setView] = useState<AdminView>('dashboard');

  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'users':
        return <UserManagement adminUser={adminUser} />;
      case 'finance':
        return <Financials />;
      case 'ebooks':
        return <EbooksAndFiles />;
      case 'settings':
        return <AppSettings />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[256px_1fr] gap-8 min-h-[calc(100vh-200px)]">
      <AdminSidebar currentView={view} setView={setView} />
      <main className="bg-slate-800/50 p-6 md:p-8 rounded-2xl border border-slate-700 min-w-0">
        {renderView()}
      </main>
    </div>
  );
};

export default AdminPanel;