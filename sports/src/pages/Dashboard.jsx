import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, AlertTriangle, Loader2, Calendar, CreditCard, Banknote, 
  QrCode, User, Receipt, Search, Filter, X, MousePointerClick, PlusCircle, 
  ArrowDownRight, ArrowUpRight, Wallet, CheckCircle2, Tag, Layers
} from 'lucide-react';
import api from '../utils/api';

const springTransition = { type: "spring", stiffness: 350, damping: 28 };

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 14, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: springTransition }
};

// Helper function to extract variant info from item name string e.g. "Shoes (Red, XL)"
const parseVariantName = (fullName = '') => {
  const match = fullName.match(/^(.*?)\s*\((.*?)\)$/);
  if (match) {
    return { name: match[1].trim(), variantLabel: match[2].trim() };
  }
  return { name: fullName, variantLabel: null };
};

// Map ISO Date to Chart Bucket Label
const getTransactionLabel = (txDate, currentPeriod) => {
  if (!txDate) return '';
  const d = new Date(txDate);
  if (isNaN(d.getTime())) return '';

  if (currentPeriod === 'weekly') {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[d.getDay()];
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

// Dynamically generate 100% mathematically synchronized chart data from raw transactions & expenses
const generateSynchronizedChartData = (transactions = [], expenses = [], timeframe = 'weekly', backendChart = []) => {
  let labels = [];
  if (timeframe === 'weekly') {
    labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  } else if (timeframe === 'monthly') {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    labels = Array.from({ length: daysInMonth }, (_, i) => `Day ${i + 1}`);
  } else if (timeframe === 'yearly') {
    labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  }

  const bucketMap = {};
  labels.forEach((label) => {
    bucketMap[label] = { label, sales: 0, cashIn: 0, expenses: 0, net: 0 };
  });

  // Aggregate Sales
  transactions.forEach((tx) => {
    const label = getTransactionLabel(tx.date, timeframe);
    if (bucketMap[label]) {
      bucketMap[label].sales += Number(tx.total || 0);
    }
  });

  // Aggregate Cash In & Expenses
  expenses.forEach((exp) => {
    const label = getTransactionLabel(exp.date, timeframe);
    if (bucketMap[label]) {
      if (exp.type === 'cash_in') {
        bucketMap[label].cashIn += Number(exp.amount || 0);
      } else {
        bucketMap[label].expenses += Number(exp.amount || 0);
      }
    }
  });

  // Compute Net Balance per bucket
  return labels.map((label) => {
    const b = bucketMap[label];
    b.net = b.sales + b.cashIn - b.expenses;
    return b;
  });
};

export default function Dashboard() {
  const [stats, setStats] = useState({
    grossSales: 0,
    totalExpenses: 0,
    totalCashIn: 0,
    netRevenue: 0,
    activeCategories: 0,
    lowStockCount: 0,
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
      
      const rawTransactions = response.data.transactions || [];
      const rawExpenses = response.data.expenses || [];
      const backendChart = response.data.chartData || [];

      // Generate 100% synchronized chart data matching cards
      const computedChartData = generateSynchronizedChartData(
        rawTransactions, 
        rawExpenses, 
        selectedTimeframe, 
        backendChart
      );

      // Card Totals
      const calculatedSales = rawTransactions.reduce((sum, t) => sum + Number(t.total || 0), 0);
      const calculatedCashIn = rawExpenses.filter(e => e.type === 'cash_in').reduce((sum, e) => sum + Number(e.amount || 0), 0);
      const calculatedExpenses = rawExpenses.filter(e => e.type === 'expense').reduce((sum, e) => sum + Number(e.amount || 0), 0);
      const calculatedNet = calculatedSales + calculatedCashIn - calculatedExpenses;

      setStats({
        grossSales: response.data.grossSales ?? calculatedSales,
        totalExpenses: response.data.totalExpenses ?? calculatedExpenses,
        totalCashIn: response.data.totalCashIn ?? calculatedCashIn,
        netRevenue: response.data.netRevenue ?? calculatedNet,
        activeCategories: response.data.activeCategories || 0,
        lowStockCount: response.data.lowStockCount || response.data.lowStockWarnings?.length || 0,
        lowStockWarnings: response.data.lowStockWarnings || [],
        chartData: computedChartData,
        transactions: rawTransactions,
        expenses: rawExpenses
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

  const handleBarClick = (data) => {
    if (!data || (!data.activeLabel && !data.label)) return;
    const clickedLabel = data.activeLabel || data.label;
    setSelectedBar((prev) => (prev === clickedLabel ? null : clickedLabel));
  };

  // Filter Sales Transactions for Selected Bar & Search Term
  const filteredTransactions = stats.transactions.filter((tx) => {
    const q = searchFilter.toLowerCase();
    const matchesSearch = 
      tx.invoiceNo.toLowerCase().includes(q) ||
      tx.customerName.toLowerCase().includes(q) ||
      tx.items.some((item) => 
        item.name.toLowerCase().includes(q) || 
        (item.sku && item.sku.toLowerCase().includes(q))
      );

    const txLabel = getTransactionLabel(tx.date, timeframe);
    const matchesBar = selectedBar ? txLabel === selectedBar : true;

    return matchesSearch && matchesBar;
  });

  // Filter Expenses / Cash-In for Selected Bar & Search Term
  const filteredExpenses = stats.expenses.filter((exp) => {
    const q = searchFilter.toLowerCase();
    const matchesSearch = exp.reason.toLowerCase().includes(q);
    const expLabel = getTransactionLabel(exp.date, timeframe);
    const matchesBar = selectedBar ? expLabel === selectedBar : true;

    return matchesSearch && matchesBar;
  });

  // Day Summaries for Audit Ledger
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

  // Custom Stacked Bar Tooltip
  const CustomStackedTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const salesVal = payload.find(p => p.dataKey === 'sales')?.value || 0;
      const cashInVal = payload.find(p => p.dataKey === 'cashIn')?.value || 0;
      const expVal = payload.find(p => p.dataKey === 'expenses')?.value || 0;
      const netVal = salesVal + cashInVal - expVal;

      return (
        <div className="bg-white/95 backdrop-blur-xl p-3.5 rounded-2xl border border-black/[0.08] shadow-2xl text-xs space-y-2 min-w-[180px]">
          <p className="font-bold text-neutral-900 border-b border-black/[0.05] pb-1.5">{label}</p>
          <div className="space-y-1 font-mono text-[11px]">
            <div className="flex justify-between items-center text-zinc-600">
              <span className="flex items-center gap-1.5 font-sans font-medium text-neutral-600">
                <span className="w-2 h-2 rounded-full bg-zinc-500 inline-block" /> Gross Sales:
              </span>
              <span>₹{salesVal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-blue-600">
              <span className="flex items-center gap-1.5 font-sans font-medium text-neutral-600">
                <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Cash In:
              </span>
              <span>₹{cashInVal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-rose-600">
              <span className="flex items-center gap-1.5 font-sans font-medium text-neutral-600">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Expenses:
              </span>
              <span>-₹{expVal.toFixed(2)}</span>
            </div>
            <div className="border-t border-black/[0.06] pt-1.5 mt-1 flex justify-between items-center font-bold text-neutral-900 text-xs">
              <span className="font-sans">Net Balance:</span>
              <span>₹{netVal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="flex flex-col gap-8 max-w-7xl mx-auto w-full pb-16 font-sans antialiased text-neutral-900 select-none"
    >
      
      {/* HEADER BAR & CASH FLOW ACTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Financial & Inventory Dashboard</h1>
          <p className="text-xs text-neutral-400 mt-0.5">Real-time revenue telemetry, variant level stock warnings, and transaction audit ledger</p>
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

      {/* 1. TOP FINANCIAL & INVENTORY SUMMARY CARDS (5 CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Card 1: Net Balance */}
        <motion.div 
          variants={cardVariants}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className="bg-white/80 backdrop-blur-2xl p-5 rounded-[22px] border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Net Balance</p>
            <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shadow-inner">
              <Wallet size={16} />
            </div>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900">
            ₹{stats.netRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h2>
        </motion.div>

        {/* Card 2: Gross Sales */}
        <motion.div 
          variants={cardVariants}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className="bg-white/80 backdrop-blur-2xl p-5 rounded-[22px] border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Gross Sales</p>
            <div className="w-8 h-8 bg-zinc-100 rounded-xl flex items-center justify-center text-zinc-700 shadow-inner">
              <TrendingUp size={16} />
            </div>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900">
            ₹{stats.grossSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h2>
        </motion.div>

        {/* Card 3: Total Cash In */}
        <motion.div 
          variants={cardVariants}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className="bg-white/80 backdrop-blur-2xl p-5 rounded-[22px] border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Cash In</p>
            <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shadow-inner">
              <ArrowUpRight size={16} />
            </div>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-blue-600">
            ₹{stats.totalCashIn.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h2>
        </motion.div>

        {/* Card 4: Total Expenses */}
        <motion.div 
          variants={cardVariants}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className="bg-white/80 backdrop-blur-2xl p-5 rounded-[22px] border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Expenses</p>
            <div className="w-8 h-8 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500 shadow-inner">
              <ArrowDownRight size={16} />
            </div>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-rose-600">
            ₹{stats.totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h2>
        </motion.div>

        {/* Card 5: Low Stock Alert Metric */}
        <motion.div 
          variants={cardVariants}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className="bg-white/80 backdrop-blur-2xl p-5 rounded-[22px] border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Stock Alerts</p>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-inner ${
              stats.lowStockCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
            }`}>
              <AlertTriangle size={16} />
            </div>
          </div>
          <h2 className={`text-xl font-bold tracking-tight ${stats.lowStockCount > 0 ? 'text-amber-600' : 'text-neutral-900'}`}>
            {stats.lowStockCount} <span className="text-xs font-normal text-neutral-400">items</span>
          </h2>
        </motion.div>

      </div>

      {/* 2. REVENUE ANALYTICS CHART (SINGLE STACKED BAR) */}
      <motion.div 
        variants={cardVariants}
        className="bg-white/90 backdrop-blur-2xl p-7 rounded-[28px] border border-black/[0.06] shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/[0.05] pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-lg font-semibold tracking-tight text-neutral-900">Net Revenue Breakdown</h3>
              <AnimatePresence>
                {selectedBar && (
                  <motion.span 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="bg-black text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm"
                  >
                    <Filter size={10} /> Active Filter: {selectedBar}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">Stacked view of Gross Sales (Ash), Cash In (Blue), and Expenses (Red)</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Color Legend */}
            <div className="hidden md:flex items-center gap-3 text-[11px] font-medium text-neutral-600 bg-neutral-100/60 px-3 py-1.5 rounded-full border border-black/[0.04]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-500" /> Sales (Ash)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Cash In
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Expenses
              </span>
            </div>

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
                  <X size={13} /> Reset
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
                <option value="yearly">Yearly View</option>
              </select>
            </div>
          </div>
        </div>

        {/* Chart Canvas with Clean Selection (No browser outline ring) */}
        <div className="h-[360px] w-full relative [&_*]:outline-none [&_.recharts-surface]:outline-none">
          {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-md flex items-center justify-center text-neutral-400 gap-2 z-10 rounded-2xl">
              <Loader2 className="animate-spin text-neutral-800" size={20} />
              <span className="text-xs font-medium text-neutral-700">Updating analytics...</span>
            </div>
          )}

          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={stats.chartData} 
              onClick={handleBarClick}
              accessibilityLayer={false}
              margin={{ top: 15, right: 10, left: 10, bottom: 5 }}
            >
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
                cursor={{ fill: 'rgba(0, 0, 0, 0.03)', radius: 12 }}
                content={<CustomStackedTooltip />}
              />
              
              {/* Stacked Single Bar Components */}
              {/* 1. Gross Sales Segment (Ash / Light Charcoal) */}
              <Bar 
                dataKey="sales" 
                stackId="singleBar" 
                fill="#71717A" 
                maxBarSize={44}
                animationDuration={800}
                style={{ cursor: 'pointer' }}
              />

              {/* 2. Cash In Segment (Soft Accent Blue) */}
              <Bar 
                dataKey="cashIn" 
                stackId="singleBar" 
                fill="#3B82F6" 
                maxBarSize={44}
                animationDuration={800}
                style={{ cursor: 'pointer' }}
              />

              {/* 3. Expenses Segment (Muted Crimson / Red) */}
              <Bar 
                dataKey="expenses" 
                stackId="singleBar" 
                fill="#F43F5E" 
                radius={[6, 6, 0, 0]}
                maxBarSize={44}
                animationDuration={800}
                style={{ cursor: 'pointer' }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* 3. LOW STOCK & VARIANT WARNINGS PANEL */}
      {stats.lowStockWarnings && stats.lowStockWarnings.length > 0 && (
        <motion.div 
          variants={cardVariants}
          className="bg-amber-50/50 backdrop-blur-2xl p-6 rounded-[28px] border border-amber-200/60 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-amber-900">
              <AlertTriangle size={20} className="text-amber-600" />
              <h3 className="text-sm font-bold tracking-tight">Low Stock & Variant Inventory Alerts</h3>
            </div>
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-100/80 px-2.5 py-0.5 rounded-full">
              {stats.lowStockWarnings.length} Products Require Attention
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats.lowStockWarnings.map((item) => {
              const mainQty = item.quantity ?? item.stock ?? 0;
              const hasVariants = item.variants && item.variants.length > 0;
              const lowVariants = hasVariants 
                ? item.variants.filter(v => (v.quantity ?? v.stock ?? 0) < 10)
                : [];

              return (
                <div key={item._id} className="bg-white p-3.5 rounded-2xl border border-amber-100 shadow-sm space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-neutral-400 block uppercase">{item.sku}</span>
                      <h4 className="text-xs font-bold text-neutral-900 line-clamp-1">{item.name}</h4>
                    </div>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/50">
                      {mainQty} left
                    </span>
                  </div>

                  {hasVariants && lowVariants.length > 0 && (
                    <div className="pt-2 border-t border-neutral-100 space-y-1">
                      <span className="text-[10px] font-semibold text-neutral-400 flex items-center gap-1">
                        <Layers size={10} /> Low Stock Variants:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {lowVariants.map((v, idx) => (
                          <span key={idx} className="text-[10px] bg-rose-50 text-rose-700 border border-rose-100 px-1.5 py-0.5 rounded font-mono">
                            {v.color || 'Var'} / {v.size || ''}: <strong>{v.quantity ?? v.stock ?? 0}</strong>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* 4. CONDITIONAL DRILL-DOWN AUDIT LEDGER */}
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
                    All
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
                    placeholder="Search invoice, SKU, variant..."
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

            {/* SALES RECEIPTS TABLE WITH VARIANT PARSING */}
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
                          <th className="pb-3">Items & Variant Options</th>
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
                              <div className="space-y-1.5 max-w-md">
                                {tx.items.map((item, itemIdx) => {
                                  const { name, variantLabel } = parseVariantName(item.name);
                                  return (
                                    <div key={itemIdx} className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] bg-neutral-50 px-2.5 py-1 rounded-xl border border-black/[0.04] gap-1">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-bold text-neutral-900">{item.qty}x</span>
                                        <span className="font-medium text-neutral-800">{name}</span>
                                        {variantLabel && (
                                          <span className="text-[9px] font-semibold text-neutral-600 bg-neutral-200/60 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                            <Tag size={9} /> {variantLabel}
                                          </span>
                                        )}
                                      </div>
                                      <span className="font-mono text-neutral-500 text-[10px]">
                                        ₹{(item.subtotal || (item.price * item.qty)).toFixed(2)}
                                      </span>
                                    </div>
                                  );
                                })}
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
              <p className="text-[11px] text-neutral-400 mt-0.5">Click any stacked bar in the chart above to inspect detailed order receipts and cash flows.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. EXPENSE & CASH IN ACTION MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/30 backdrop-blur-md"
            />

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