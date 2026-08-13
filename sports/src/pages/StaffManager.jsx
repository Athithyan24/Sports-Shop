import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserPlus, ShieldCheck, User, Trash2, Search, KeyRound, 
  Sparkles, X, CheckCircle2, ShieldAlert, Users, Loader2, RefreshCw 
} from 'lucide-react';
import api from '../utils/api';

const appleEase = [0.16, 1, 0.3, 1];
const springPhysics = { type: 'spring', stiffness: 350, damping: 25 };

export default function StaffManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  
  // Feedback Banners
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // New Account Form State
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'worker'
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/auth/users');
      setUsers(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load staff list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      const response = await api.post('/auth/create-user', formData);
      setSuccessMsg(`Account for "${formData.name}" created successfully!`);
      setFormData({ name: '', username: '', password: '', role: 'worker' });
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Are you sure you want to revoke access for ${name}?`)) return;

    setDeletingId(id);
    setError('');
    setSuccessMsg('');

    try {
      await api.delete(`/auth/users/${id}`);
      setSuccessMsg(`Staff member ${name} removed.`);
      setUsers((prev) => prev.filter((user) => user._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user.');
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered staff list based on search bar query
  const filteredUsers = users.filter((user) => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalAdmins = users.filter((u) => u.role === 'admin').length;
  const totalWorkers = users.filter((u) => u.role === 'worker').length;

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-neutral-900 p-4 md:p-8 font-sans select-none relative overflow-hidden">
      
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-neutral-900 text-white rounded-xl shadow-md">
                <Users size={18} />
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Staff & Account Management</h1>
            </div>
            <p className="text-xs text-neutral-500 mt-1">Provision login access, manage system credentials, and review permissions.</p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 bg-neutral-900 hover:bg-black text-white rounded-2xl text-xs font-semibold shadow-lg shadow-black/10 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <UserPlus size={16} />
            <span>Create Staff Account</span>
          </motion.button>
        </div>

        {/* Global Alert Banners */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-rose-50 border border-rose-200/80 rounded-2xl flex items-center justify-between text-rose-600 text-xs font-medium shadow-sm"
            >
              <div className="flex items-center gap-2">
                <ShieldAlert size={18} />
                <span>{error}</span>
              </div>
              <button onClick={() => setError('')} className="p-1 hover:bg-rose-100 rounded-lg"><X size={14} /></button>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-center justify-between text-emerald-700 text-xs font-medium shadow-sm"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} />
                <span>{successMsg}</span>
              </div>
              <button onClick={() => setSuccessMsg('')} className="p-1 hover:bg-emerald-100 rounded-lg"><X size={14} /></button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/80 backdrop-blur-xl border border-black/[0.04] p-5 rounded-3xl shadow-sm space-y-1">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Total Accounts</span>
            <div className="text-2xl font-bold text-neutral-900">{users.length}</div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl border border-black/[0.04] p-5 rounded-3xl shadow-sm space-y-1">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Administrators</span>
            <div className="text-2xl font-bold text-amber-600 flex items-center gap-2">
              <span>{totalAdmins}</span>
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl border border-black/[0.04] p-5 rounded-3xl shadow-sm space-y-1">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Active Workers</span>
            <div className="text-2xl font-bold text-blue-600 flex items-center gap-2">
              <span>{totalWorkers}</span>
              <User size={18} />
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/60 backdrop-blur-md p-2 rounded-2xl border border-black/[0.04]">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, ID, or role..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-black/[0.06] rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-black/10 transition-all text-neutral-900"
            />
          </div>
          <button 
            onClick={fetchUsers} 
            className="p-2 hover:bg-neutral-200/50 rounded-xl text-neutral-500 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Staff Table Card */}
        <div className="bg-white/80 backdrop-blur-2xl rounded-[32px] border border-black/[0.06] shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3 text-neutral-400">
              <Loader2 className="animate-spin text-neutral-900" size={24} />
              <span className="text-xs font-medium">Fetching accounts...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center space-y-2 text-neutral-400">
              <Users size={32} className="mx-auto text-neutral-300" />
              <p className="text-xs font-medium">No staff members found matching your query.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50/50 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    <th className="py-4 px-6">User Details</th>
                    <th className="py-4 px-6">System Role</th>
                    <th className="py-4 px-6">Username / Worker ID</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs">
                  <AnimatePresence>
                    {filteredUsers.map((user) => (
                      <motion.tr
                        key={user._id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ ease: appleEase }}
                        className="hover:bg-neutral-50/80 transition-colors group"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs shadow-sm ${
                              user.role === 'admin' 
                                ? 'bg-amber-100 text-amber-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-neutral-900">{user.name}</div>
                              <div className="text-[10px] text-neutral-400">
                                Added {new Date(user.createdAt || Date.now()).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold tracking-wide uppercase ${
                            user.role === 'admin'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                              : 'bg-blue-50 text-blue-700 border border-blue-200/60'
                          }`}>
                            {user.role === 'admin' ? <ShieldCheck size={12} /> : <User size={12} />}
                            <span>{user.role}</span>
                          </span>
                        </td>

                        <td className="py-4 px-6 font-mono text-neutral-600 font-medium">
                          @{user.username}
                        </td>

                        <td className="py-4 px-6 text-right">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            disabled={deletingId === user._id}
                            onClick={() => handleDeleteUser(user._id, user.name)}
                            className="p-2 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                            title="Remove Staff Access"
                          >
                            {deletingId === user._id ? (
                              <Loader2 size={16} className="animate-spin text-rose-600" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </motion.button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Creation Modal / Backdrop */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-neutral-900/40 backdrop-blur-md"
            />

            {/* Glass Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={springPhysics}
              className="relative w-full max-w-md bg-white rounded-[32px] border border-black/[0.08] p-8 shadow-2xl space-y-6 z-10"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-neutral-100 rounded-xl text-neutral-900">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-neutral-900">New Account</h2>
                    <p className="text-xs text-neutral-400">Generate credentials for staff</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-neutral-100 rounded-full text-neutral-400 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4">
                
                <div>
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Alex Johnson"
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-black/[0.06] rounded-2xl text-xs font-medium outline-none focus:bg-white focus:ring-2 focus:ring-black/10 transition-all text-neutral-900"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                    Username / Worker ID
                  </label>
                  <div className="relative">
                    <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="e.g., alex_staff"
                      className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 border border-black/[0.06] rounded-2xl text-xs font-medium outline-none focus:bg-white focus:ring-2 focus:ring-black/10 transition-all text-neutral-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                    Temporary Password
                  </label>
                  <div className="relative">
                    <KeyRound size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 border border-black/[0.06] rounded-2xl text-xs font-medium outline-none focus:bg-white focus:ring-2 focus:ring-black/10 transition-all text-neutral-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                    Assigned Privilege Level
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-black/[0.06] rounded-2xl text-xs font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-black/10 transition-all text-neutral-900 cursor-pointer"
                  >
                    <option value="worker">Worker (POS & Inventory Access)</option>
                    <option value="admin">Administrator (Full Access)</option>
                  </select>
                </div>

                <div className="pt-3">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    disabled={submitting}
                    type="submit"
                    className="w-full py-3 bg-neutral-900 hover:bg-black text-white rounded-2xl text-xs font-semibold shadow-lg shadow-black/10 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Confirm & Register Account'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}