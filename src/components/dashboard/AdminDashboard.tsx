import React from 'react';
import { Package, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';
import { useInventoryStore } from '../../store';
import { DashboardCard } from './DashboardCard';

function AdminDashboard() {
  const { products, transactions } = useInventoryStore();

  const totalProducts = products.length;
  const lowStockItems = products.filter(p => p.quantity <= p.minStockLevel);
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentTransactions = transactions
    .filter(t => new Date(t.createdAt) >= thirtyDaysAgo && t.status === 'completed');

  const inboundCount = recentTransactions.filter(t => t.type === 'inbound').length;
  const outboundCount = recentTransactions.filter(t => t.type === 'outbound').length;

  const calculateTrend = (type: 'inbound' | 'outbound') => {
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    const recent = transactions.filter(t => 
      t.type === type && 
      t.status === 'completed' &&
      new Date(t.createdAt) >= fifteenDaysAgo
    ).length;

    const previous = transactions.filter(t => 
      t.type === type && 
      t.status === 'completed' &&
      new Date(t.createdAt) >= thirtyDaysAgo && 
      new Date(t.createdAt) < fifteenDaysAgo
    ).length;

    if (previous === 0) return { trend: 'neutral', value: 'No previous data' };
    const change = ((recent - previous) / previous) * 100;
    return {
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
      value: `${Math.abs(change).toFixed(1)}% from last period`
    };
  };

  const inboundTrend = calculateTrend('inbound');
  const outboundTrend = calculateTrend('outbound');

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <DashboardCard
        title="Total Products"
        value={totalProducts}
        icon={Package}
        trend="neutral"
        trendValue="Current inventory count"
      />
      <DashboardCard
        title="Inbound Orders"
        value={inboundCount}
        icon={TrendingUp}
        trend={inboundTrend.trend}
        trendValue={inboundTrend.value}
      />
      <DashboardCard
        title="Outbound Orders"
        value={outboundCount}
        icon={TrendingDown}
        trend={outboundTrend.trend}
        trendValue={outboundTrend.value}
      />
      <DashboardCard
        title="Low Stock Items"
        value={lowStockItems.length}
        icon={AlertTriangle}
        trend={lowStockItems.length > 0 ? 'down' : 'neutral'}
        trendValue={lowStockItems.length > 0 ? 'Requires attention' : 'Stock levels healthy'}
      />
    </div>
  );
}

export default AdminDashboard;