import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Package, AlertCircle, Loader2 } from 'lucide-react';
import api from '../utils/api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    itemsSold: 0,
    lowStockCount: 0,
    chartData: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await api.get('/dashboard/stats');
        setStats(response.data);
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-brand-textMuted pt-20">
        <Loader2 className="animate-spin mr-2" size={24} /> Loading dashboard...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Revenue Card */}
        <div className="bg-brand-white p-6 rounded-xl border border-brand-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-brand-textMain">
            <TrendingUp size={20} />
          </div>
          <div>
            <p className="text-sm text-brand-textMuted font-medium mb-1">Total Revenue</p>
            <h2 className="text-2xl font-bold text-brand-textMain">${stats.totalRevenue.toFixed(2)}</h2>
          </div>
        </div>

        {/* Items Sold Card */}
        <div className="bg-brand-white p-6 rounded-xl border border-brand-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-brand-textMain">
            <Package size={20} />
          </div>
          <div>
            <p className="text-sm text-brand-textMuted font-medium mb-1">Items Sold</p>
            <h2 className="text-2xl font-bold text-brand-textMain">{stats.itemsSold}</h2>
          </div>
        </div>

        {/* Low Stock Alerts Card */}
        <div className="bg-brand-white p-6 rounded-xl border border-red-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-500">
            <AlertCircle size={20} />
          </div>
          <div>
            <p className="text-sm text-brand-textMuted font-medium mb-1">Low Stock Alerts</p>
            <h2 className="text-2xl font-bold text-red-600">{stats.lowStockCount} Items</h2>
          </div>
        </div>

      </div>

      {/* Chart Section */}
      <div className="bg-brand-white p-6 rounded-xl border border-brand-border shadow-sm mt-2">
        <h3 className="text-lg font-bold text-brand-textMain mb-6">Revenue Overview</h3>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1f2937" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#1f2937" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} tickFormatter={(value) => `$${value}`} dx={-10} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
                itemStyle={{ color: '#1f2937', fontWeight: 600 }}
                formatter={(value) => [`$${value}`, 'Revenue']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#1f2937" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}