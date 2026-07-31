import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

const AdminLayout = () => (
  <div className="min-h-screen bg-[#F7F7FB] flex flex-col">
    <AdminHeader />
    <div className="flex flex-1 min-h-0">
      <AdminSidebar />
      <div className="flex-1 min-w-0">
        <main className="p-4 lg:p-8 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  </div>
);

export default AdminLayout;
