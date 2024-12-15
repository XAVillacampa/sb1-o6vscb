import React from 'react';
import { Package, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';
import { useInventoryStore } from '../../store';
import { DashboardCard } from './DashboardCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function AdminDashboard() {
  const { products, transactions } = useInventoryStore();

  const totalProducts = products.length;
  const lowStockItems = products.filter(p => p.quantity <= p.minStockLevel);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Filter completed transactions from the last 30 days
  const recentTransactions = transactions.filter(t => new Date(t.createdAt) >= thirtyDaysAgo && t.status === 'completed');

  // Group inbound and outbound transactions
  const inboundCount = recentTransactions.filter(t => t.type === 'inbound').length;
  const outboundCount = recentTransactions.filter(t => t.type === 'outbound').length;

  // Helper function to calculate trends
  const calculateTrend = (type: 'inbound' | 'outbound') => {
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    const recent = recentTransactions.filter(t => 
      t.type === type && 
      t.status === 'completed' &&
      new Date(t.createdAt) >= fifteenDaysAgo
    ).length;

    const previous = recentTransactions.filter(t => 
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

  // Step 1: Aggregate products by vendorNumber
  const aggregatedData = products.reduce((acc, item) => {
    // If vendorNumber already exists in accumulator, aggregate the data
    if (acc[item.vendorNumber]) {
      acc[item.vendorNumber].stockLevel += item.quantity;
      acc[item.vendorNumber].inbound += inboundCount;
      acc[item.vendorNumber].outbound += outboundCount;
      acc[item.vendorNumber].lowStock += item.quantity <= item.minStockLevel ? item.quantity : 0;
    } else {
      // If vendorNumber is not in accumulator, initialize it
      acc[item.vendorNumber] = {
        vendorNumber: item.vendorNumber,
        stockLevel: item.quantity,
        inbound: inboundCount,
        outbound: outboundCount,
        lowStock: item.quantity <= item.minStockLevel ? item.quantity : 0,
      };
    }
    return acc;
  }, {});

  // Step 2: Convert the aggregated data object into an array
  const chartData = Object.values(aggregatedData);

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
      
      {/* Stacked Bar Chart with Stock Level, Inbound, Outbound, and Low Stock Data */}
      {products.length > 0 && (
        <div className="col-span-1 sm:col-span-2 lg:col-span-4">
          <h3 className="text-xl font-semibold mb-4 text-black dark:text-white">Products Data with Total Stock, Inbound, Outbound, and Low Stock</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="vendorNumber" 
              tickFormatter={(value) => value.length > 10 ? value.slice(0, 10) + '...' : value}/>
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="stockLevel" stackId="a" fill="#616ec1" name="Total Stock" />
              <Bar dataKey="inbound" stackId="a" fill="#8884d8" name="Inbound" />
              <Bar dataKey="outbound" stackId="a" fill="#a0adff" name="Outbound" />
              <Bar dataKey="lowStock" stackId="a" fill="#c6cdfa" name="Low Stock" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
