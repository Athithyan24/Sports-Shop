import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, AlertCircle, Loader2, PieChart as PieChartIcon, 
  Calendar, CreditCard, Banknote, QrCode, User, ShoppingBag, Receipt, Search, Filter, X, 
  MousePointerClick, PlusCircle, ArrowDownRight, ArrowUpRight, Wallet, CheckCircle2 
} from 'lucide-react';
import api from '../utils/api';

const springTransition = { type: "spring", stiffness: 350, damping: 28 };

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: springTransition }
};

export default function Dashboard() {
  const [stats, setStats] = useState({
    grossSales: 0,
    totalExpenses: 0,
    totalCashIn: 0,
    netRevenue: 0,
    activeCategories: 0,
    lowStockWarnings: [],
    chartData: [],
    transactions: [],
    expenses: []
  });

  const [timeframe, setTimeframe] = useState('weekly');
  const [selectedBar, setSelectedBar] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal & Form State for Expense / Cash In
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formType, setFormType] = useState('expense'); // 'expense' | 'cash_in'
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'sales' | 'expenses' | 'cash_in'

  useEffect(() => {
    setSelectedBar(null);
    fetchDashboardStats(timeframe);
  }, [timeframe]);

  const fetchDashboardStats = async (selectedTimeframe) => {
    try {
      setLoading(true);
      const response = await api.get(`/dashboard/stats?timeframe=${selectedTimeframe}`);
      setStats({
        grossSales: response.data.grossSales || 0,
        totalExpenses: response.data.totalExpenses || 0,
        totalCashIn: response.data.totalCashIn || 0,
        netRevenue: response.data.netRevenue || 0,
        activeCategories: response.data.activeCategories || 0,
        lowStockWarnings: response.data.lowStockWarnings || [],
        chartData: response.data.chartData || [],
        transactions: response.data.transactions || [],
        expenses: response.data.expenses || []
      });
    } catch (error) {
      console.error("Failed to fetch dashboard stats", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCashFlow = async (e) => {
    e.preventDefault();
    if (!reason || !amount || Number(amount) <= 0) return;

    try {
      setSubmitting(true);
      await api.post('/dashboard/expense', {
        type: formType,
        reason,
        amount: Number(amount),
        date: entryDate
      });

      // Reset Form & Refetch
      setReason('');
      setAmount('');
      setIsModalOpen(false);
      await fetchDashboardStats(timeframe);
    } catch (error) {
      console.error("Failed to record cash flow", error);
    } finally {
      setSubmitting(false);
    }
  };

  const getTransactionLabel = (txDate, currentPeriod) => {
    if (!txDate) return '';
    const d = new Date(txDate);
    if (isNaN(d.getTime())) return '';

    if (currentPeriod === 'weekly') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const dayIndex = d.getDay();
      return days[dayIndex === 0 ? 6 : dayIndex - 1];
    }
    if (currentPeriod === 'monthly') {
      return `Day ${d.getDate()}`;
    }
    if (currentPeriod === 'yearly') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months[d.getMonth()];
    }
    return '';
  };

  const handleBarClick = (data) => {
    if (!data || !data.label) return;
    setSelectedBar((prev) => (prev === data.label ? null : data.label));
  };

  // Filter Sales Transactions for Selected Bar
  const filteredTransactions = stats.transactions.filter((tx) => {
    const q = searchFilter.toLowerCase();
    const matchesSearch = 
      tx.invoiceNo.toLowerCase().includes(q) ||
      tx.customerName.toLowerCase().includes(q) ||
      tx.items.some((item) => item.name.toLowerCase().includes(q));

    const txLabel = getTransactionLabel(tx.date, timeframe);
    const matchesBar = selectedBar ? txLabel === selectedBar : true;

    return matchesSearch && matchesBar;
  });

  // Filter Expenses / Cash-In for Selected Bar
  const filteredExpenses = stats.expenses.filter((exp) => {
    const q = searchFilter.toLowerCase();
    const matchesSearch = exp.reason.toLowerCase().includes(q);
    const expLabel = getTransactionLabel(exp.date, timeframe);
    const matchesBar = selectedBar ? expLabel === selectedBar : true;

    return matchesSearch && matchesBar;
  });

  // Day Summaries
  const selectedDaySales = filteredTransactions.reduce((acc, t) => acc + t.total, 0);
  const selectedDayCashIn = filteredExpenses.filter(e => e.type === 'cash_in').reduce((acc, e) => acc + e.amount, 0);
  const selectedDayExpenses = filteredExpenses.filter(e => e.type === 'expense').reduce((acc, e) => acc + e.amount, 0);
  const selectedDayNet = selectedDaySales + selectedDayCashIn - selectedDayExpenses;

  const getPaymentIcon = (method) => {
    switch (method?.toLowerCase()) {
      case 'card': return <CreditCard size={13} className="text-blue-600" />;
      case 'upi': return <QrCode size={13} className="text-purple-600" />;
      case 'cash':
      default: return <Banknote size={13} className="text-emerald-600" />;
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="flex flex-col gap-8 max-w-7xl mx-auto w-full pb-16 font-sans antialiased text-neutral-900"
    >
      
      {/* HEADER BAR & CASH FLOW ACTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Financial Dashboard</h1>
          <p className="text-xs text-neutral-400 mt-0.5">Real-time revenue telemetry, daily expense logs, and sales ledger</p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-neutral-900 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-lg shadow-black/10 hover:bg-black transition-all"
        >
          <PlusCircle size={16} />
          <span>Record Expense / Cash In</span>
        </motion.button>
      </div>

      {/* 1. TOP FINANCIAL SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Net Revenue */}
        <motion.div 
          variants={cardVariants}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className="bg-white/80 backdrop-blur-2xl p-6 rounded-[24px] border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner">
            <Wallet size={22} />
          </div>
          <div>
            <p className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider mb-0.5">Net Balance</p>
            <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">
              ₹{stats.netRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h2>
          </div>
        </motion.div>

        {/* Gross Sales */}
        <motion.div 
          variants={cardVariants}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className="bg-white/80 backdrop-blur-2xl p-6 rounded-[24px] border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-neutral-100/80 rounded-2xl flex items-center justify-center text-neutral-900 shadow-inner">
            <TrendingUp size={22} />
          </div>
          <div>
            <p className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider mb-0.5">Gross Sales</p>
            <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">
              ₹{stats.grossSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h2>
          </div>
        </motion.div>

        {/* Total Expenses */}
        <motion.div 
          variants={cardVariants}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className="bg-white/80 backdrop-blur-2xl p-6 rounded-[24px] border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 shadow-inner">
            <ArrowDownRight size={22} />
          </div>
          <div>
            <p className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider mb-0.5">Total Expenses</p>
            <h2 className="text-2xl font-semibold tracking-tight text-rose-600">
              ₹{stats.totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h2>
          </div>
        </motion.div>

        {/* Total Cash In */}
        <motion.div 
          variants={cardVariants}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className="bg-white/80 backdrop-blur-2xl p-6 rounded-[24px] border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
            <ArrowUpRight size={22} />
          </div>
          <div>
            <p className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider mb-0.5">Cash Inflows</p>
            <h2 className="text-2xl font-semibold tracking-tight text-blue-600">
              ₹{stats.totalCashIn.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h2>
          </div>
        </motion.div>

      </div>

      {/* 2. REVENUE ANALYTICS CHART */}
      <motion.div 
        variants={cardVariants}
        className="bg-white/90 backdrop-blur-2xl p-7 rounded-[28px] border border-black/[0.06] shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/[0.05] pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-lg font-semibold tracking-tight text-neutral-900">Net Revenue Analytics</h3>
              <AnimatePresence>
                {selectedBar && (
                  <motion.span 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="bg-black text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm"
                  >
                    <Filter size={10} /> Active: {selectedBar}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">Click any bar to reveal sales receipts and daily expense logs below</p>
          </div>

          <div className="flex items-center gap-3">
            <AnimatePresence>
              {selectedBar && (
                <motion.button
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedBar(null)}
                  className="text-xs font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1.5 bg-rose-50/80 px-3.5 py-1.5 rounded-full border border-rose-100 transition-colors shadow-sm"
                >
                  <X size={13} /> Reset Filter
                </motion.button>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-2 bg-neutral-100/70 px-3.5 py-1.5 rounded-full border border-black/[0.04] shadow-inner">
              <Calendar size={15} className="text-neutral-400" />
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="bg-transparent text-xs font-semibold text-neutral-800 outline-none cursor-pointer pr-1"
              >
                <option value="weekly">Weekly View</option>
                <option value="monthly">Monthly View</option>
                <option value="yearly">Yearly / Annual View</option>
              </select>
            </div>
          </div>
        </div>

        {/* Chart Canvas */}
        <div className="h-[360px] w-full relative">
          {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-md flex items-center justify-center text-neutral-400 gap-2 z-10 rounded-2xl">
              <Loader2 className="animate-spin text-neutral-800" size={20} />
              <span className="text-xs font-medium text-neutral-700">Updating analytics...</span>
            </div>
          )}

          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.chartData} margin={{ top: 15, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F2" />
              <XAxis 
                dataKey="label" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#A3A3A3', fontSize: 11, fontWeight: 500 }} 
                dy={10} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#A3A3A3', fontSize: 11, fontWeight: 500 }} 
                tickFormatter={(val) => `₹${val}`} 
                dx={-10} 
              />
              <Tooltip 
                cursor={{ fill: 'rgba(0, 0, 0, 0.02)' }}
                contentStyle={{ 
                  borderRadius: '18px', 
                  border: '1px solid rgba(0,0,0,0.06)', 
                  boxShadow: '0 20px 30px -10px rgba(0,0,0,0.07)',
                  backgroundColor: '#FFFFFF',
                  padding: '12px 16px'
                }}
                formatter={(value) => [`₹${Number(value).toFixed(2)}`, 'Net Revenue']}
                labelStyle={{ color: '#171717', fontWeight: 700, marginBottom: '2px', fontSize: '12px' }}
              />
              
              <Bar 
                dataKey="revenue" 
                onClick={handleBarClick}
                cursor="pointer"
                radius={[8, 8, 0, 0]} 
                maxBarSize={48}
                animationDuration={1000}
                animationEasing="ease-out"
              >
                {stats.chartData.map((entry, index) => {
                  const isSelected = selectedBar === entry.label;
                  let barFill = '#171717';
                  if (selectedBar) {
                    barFill = isSelected ? '#000000' : '#E5E5EA';
                  }
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={barFill} 
                      className="transition-all duration-300 hover:opacity-80" 
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* 3. CONDITIONAL DRILL-DOWN AUDIT (EXPENSES + SALES) */}
      <AnimatePresence mode="wait">
        {selectedBar ? (
          <motion.div
            key="audit-details"
            initial={{ opacity: 0, height: 0, y: 20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="bg-white/90 backdrop-blur-2xl p-7 rounded-[28px] border border-black/[0.06] shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6 overflow-hidden"
          >
            {/* Header & Sub-Tabs */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-black/[0.05] pb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-900 border border-black/[0.04]">
                  <Receipt size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold tracking-tight text-neutral-900">Audit Ledger</h3>
                    <span className="bg-black text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                      {selectedBar}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400">
                    Net: <strong className="text-neutral-900">₹{selectedDayNet.toFixed(2)}</strong> (Sales: ₹{selectedDaySales.toFixed(2)} | Cash In: ₹{selectedDayCashIn.toFixed(2)} | Expenses: ₹{selectedDayExpenses.toFixed(2)})
                  </p>
                </div>
              </div>

              {/* Tab Selector & Search */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="flex items-center bg-neutral-100 p-1 rounded-2xl border border-black/[0.04] w-full sm:w-auto">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${activeTab === 'all' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-900'}`}
                  >
                    All Entries
                  </button>
                  <button
                    onClick={() => setActiveTab('sales')}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${activeTab === 'sales' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-900'}`}
                  >
                    Sales ({filteredTransactions.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('expenses')}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${activeTab === 'expenses' ? 'bg-white shadow-sm text-rose-600' : 'text-neutral-500 hover:text-neutral-900'}`}
                  >
                    Expenses ({filteredExpenses.filter(e => e.type === 'expense').length})
                  </button>
                  <button
                    onClick={() => setActiveTab('cash_in')}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${activeTab === 'cash_in' ? 'bg-white shadow-sm text-blue-600' : 'text-neutral-500 hover:text-neutral-900'}`}
                  >
                    Cash In ({filteredExpenses.filter(e => e.type === 'cash_in').length})
                  </button>
                </div>

                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={14} />
                  <input
                    type="text"
                    placeholder="Search ledger..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 bg-neutral-100/70 border border-black/[0.04] rounded-2xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-black/10 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* EXPENSES & CASH IN LISTING */}
            {(activeTab === 'all' || activeTab === 'expenses' || activeTab === 'cash_in') && filteredExpenses.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Cash Flow & Daily Expense Entries</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredExpenses
                    .filter(e => activeTab === 'all' || activeTab === e.type)
                    .map((exp) => (
                      <div 
                        key={exp._id}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                          exp.type === 'expense' 
                            ? 'bg-rose-50/40 border-rose-100/80 text-rose-900' 
                            : 'bg-blue-50/40 border-blue-100/80 text-blue-900'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                            exp.type === 'expense' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
                          }`}>
                            {exp.type === 'expense' ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                          </div>
                          <div>
                            <p className="text-xs font-semibold leading-snug">{exp.reason}</p>
                            <span className="text-[10px] text-neutral-400">
                              {new Date(exp.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {exp.type === 'expense' ? 'Outflow' : 'Capital Inflow'}
                            </span>
                          </div>
                        </div>
                        <span className={`font-mono font-semibold text-xs ${exp.type === 'expense' ? 'text-rose-600' : 'text-blue-600'}`}>
                          {exp.type === 'expense' ? '-' : '+'}₹{exp.amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* SALES RECEIPTS TABLE */}
            {(activeTab === 'all' || activeTab === 'sales') && (
              <div className="space-y-3">
                {activeTab === 'all' && <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider pt-2">Customer Order Receipts</h4>}
                {filteredTransactions.length === 0 ? (
                  <div className="py-8 text-center text-neutral-400 text-xs">No sales receipts found for {selectedBar}</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-black/[0.05] text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                          <th className="pb-3 pl-2">Invoice & Time</th>
                          <th className="pb-3">Customer</th>
                          <th className="pb-3">Items Purchased</th>
                          <th className="pb-3">Payment</th>
                          <th className="pb-3 text-right pr-2">Total Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/[0.04] text-xs">
                        {filteredTransactions.map((tx, idx) => (
                          <motion.tr 
                            key={tx._id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            className="hover:bg-neutral-50/80 transition-colors"
                          >
                            <td className="py-3.5 pl-2 vertical-align-top">
                              <span className="font-mono font-semibold text-neutral-900 block">{tx.invoiceNo}</span>
                              <span className="text-[10px] text-neutral-400">
                                {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </td>
                            <td className="py-3.5 vertical-align-top">
                              <div className="flex items-center gap-1.5">
                                <User size={13} className="text-neutral-400" />
                                <span className="font-medium text-neutral-800">{tx.customerName}</span>
                              </div>
                            </td>
                            <td className="py-3.5 vertical-align-top">
                              <div className="space-y-1 max-w-md">
                                {tx.items.map((item, itemIdx) => (
                                  <div key={itemIdx} className="flex items-center justify-between text-[11px] bg-neutral-50 px-2.5 py-0.5 rounded-lg border border-black/[0.04]">
                                    <span className="font-medium text-neutral-800">
                                      <span className="font-bold text-neutral-900">{item.qty}x</span> {item.name}
                                    </span>
                                    <span className="font-mono text-neutral-500 text-[10px]">
                                      ₹{item.subtotal.toFixed(2)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="py-3.5 vertical-align-top">
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-100 text-[10px] font-bold text-neutral-800 uppercase border border-black/[0.04]">
                                {getPaymentIcon(tx.paymentMethod)}
                                <span>{tx.paymentMethod}</span>
                              </div>
                            </td>
                            <td className="py-3.5 text-right pr-2 vertical-align-top font-mono font-semibold text-neutral-900">
                              ₹{tx.total.toFixed(2)}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

          </motion.div>
        ) : (
          <motion.div
            key="empty-callout"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-neutral-50/50 backdrop-blur-md rounded-[24px] border border-dashed border-neutral-200/80 p-8 text-center flex flex-col items-center justify-center gap-3 text-neutral-400"
          >
            <motion.div 
              animate={{ y: [0, -5, 0] }} 
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-neutral-800 border border-black/[0.05]"
            >
              <MousePointerClick size={20} />
            </motion.div>
            <div>
              <p className="text-xs font-semibold text-neutral-800">Select a Chart Bar</p>
              <p className="text-[11px] text-neutral-400 mt-0.5">Click any revenue bar in the chart above to expand sales receipts and daily expense entries for that date.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. APPLE-STYLE EXPENSE & CASH IN ACTION MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Glassmorphic Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/30 backdrop-blur-md"
            />

            {/* Spring Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={springTransition}
              className="relative bg-white/95 backdrop-blur-2xl rounded-[32px] border border-black/[0.08] p-7 shadow-2xl max-w-md w-full space-y-6 z-10"
            >
              <div className="flex items-center justify-between border-b border-black/[0.05] pb-4">
                <div>
                  <h3 className="text-lg font-bold text-neutral-900">Record Cash Flow</h3>
                  <p className="text-xs text-neutral-400">Log daily store expenses or capital cash in</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-black transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleAddCashFlow} className="space-y-4">
                {/* Type Switcher */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-100 rounded-2xl border border-black/[0.04]">
                  <button
                    type="button"
                    onClick={() => setFormType('expense')}
                    className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      formType === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-neutral-500'
                    }`}
                  >
                    <ArrowDownRight size={14} /> Daily Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType('cash_in')}
                    className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      formType === 'cash_in' ? 'bg-white text-blue-600 shadow-sm' : 'text-neutral-500'
                    }`}
                  >
                    <ArrowUpRight size={14} /> Cash In
                  </button>
                </div>

                {/* Reason Field */}
                <div>
                  <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                    Entry Reason / Description
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={formType === 'expense' ? 'e.g., Tea & Refreshments, Printing, Courier' : 'e.g., Opening Cash Balance, Owner Investment'}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-black/[0.06] rounded-2xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-black/10 transition-all"
                  />
                </div>

                {/* Amount Field (₹) */}
                <div>
                  <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                    Amount (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-xs text-neutral-400">₹</span>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="any"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-2.5 bg-neutral-50 border border-black/[0.06] rounded-2xl text-xs font-mono font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-black/10 transition-all"
                    />
                  </div>
                </div>

                {/* Date Picker */}
                <div>
                  <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                    Transaction Date
                  </label>
                  <input
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-black/[0.06] rounded-2xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-black/10 transition-all"
                  />
                </div>

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  disabled={submitting}
                  type="submit"
                  className={`w-full py-3 rounded-2xl text-xs font-semibold text-white shadow-lg flex items-center justify-center gap-2 transition-all ${
                    formType === 'expense' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                  }`}
                >
                  {submitting ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                  <span>Save {formType === 'expense' ? 'Expense' : 'Cash In'} Entry</span>
                </motion.button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}