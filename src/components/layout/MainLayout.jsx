import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function MainLayout() {
  return (
    <div className="flex h-screen bg-primary-900 text-white">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet /> 
      </main>
    </div>
  );
}