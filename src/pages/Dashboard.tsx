import React from 'react';
import { useAuthStore } from '../store/auth';
import AdminDashboard from '../components/dashboard/AdminDashboard';
import VendorMetrics from '../components/dashboard/VendorMetrics';
import NewsSection from '../components/dashboard/NewsSection';

function Dashboard() {
  const { user } = useAuthStore();
  const isVendor = user?.role === 'vendor';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
      </div>

      {isVendor ? <VendorMetrics /> : <AdminDashboard />}

      <NewsSection />
    </div>
  );
}

export default Dashboard;