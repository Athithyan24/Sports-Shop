import { useState } from 'react';
import { useNavigate } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, User, Lock, ArrowRight, Loader2, AlertCircle, 
  Sparkles, KeyRound, Store 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const appleEase = [0.16, 1, 0.3, 1];
const springTransition = { type: 'spring', stiffness: 400, damping: 30 };

const containerVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: appleEase,
      staggerChildren: 0.07,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: appleEase } }
};

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('admin');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(username, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#F5F5F7] overflow-hidden flex flex-col justify-center items-center px-4 font-sans antialiased select-none">
      
      {/* Dynamic Ambient Graphics */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 40, 0],
            y: [0, -30, 0],
          }}
          transition={{ repeat: Infinity, duration: 14, ease: "easeInOut" }}
          className="absolute -top-20 -left-20 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.25, 1],
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{ repeat: Infinity, duration: 18, ease: "easeInOut" }}
          className="absolute -bottom-20 -right-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"
        />
        {/* Subtle Geometric Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      {/* Main Glassmorphic Login Card */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-md bg-white/75 backdrop-blur-3xl rounded-[36px] border border-white/80 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)] p-8 sm:p-9 space-y-6"
      >
        
        {/* Header & Logo */}
        <motion.div variants={itemVariants} className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-neutral-900 text-white shadow-xl shadow-black/10 mb-1">
            <Store size={22} className="text-blue-400" />
          </div>
          <div className="text-3xl font-extralight tracking-tight text-neutral-900">
            Sport<span className="text-[#007AFF] font-medium">Store</span>
          </div>
          <p className="text-xs text-neutral-400 font-medium">
            Management Portal & Point of Sale System
          </p>
        </motion.div>

        {/* Animated Role Segment Toggle with Sliding Pill */}
        <motion.div variants={itemVariants} className="relative grid grid-cols-2 gap-1 p-1.5 bg-neutral-100/80 backdrop-blur-md rounded-2xl border border-black/[0.04]">
          <button
            type="button"
            onClick={() => setSelectedRole('admin')}
            className={`relative z-10 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              selectedRole === 'admin' ? 'text-neutral-900' : 'text-neutral-400 hover:text-neutral-700'
            }`}
          >
            <ShieldCheck size={15} className={selectedRole === 'admin' ? 'text-amber-500' : ''} />
            <span>Administrator</span>
            {selectedRole === 'admin' && (
              <motion.div
                layoutId="activeRoleIndicator"
                className="absolute inset-0 bg-white rounded-xl shadow-sm border border-black/[0.04] -z-10"
                transition={springTransition}
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('worker')}
            className={`relative z-10 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              selectedRole === 'worker' ? 'text-neutral-900' : 'text-neutral-400 hover:text-neutral-700'
            }`}
          >
            <User size={15} className={selectedRole === 'worker' ? 'text-blue-500' : ''} />
            <span>Worker</span>
            {selectedRole === 'worker' && (
              <motion.div
                layoutId="activeRoleIndicator"
                className="absolute inset-0 bg-white rounded-xl shadow-sm border border-black/[0.04] -z-10"
                transition={springTransition}
              />
            )}
          </button>
        </motion.div>

        {/* Animated Error Banner */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              className="p-3.5 bg-rose-50/90 border border-rose-200/60 rounded-2xl flex items-center gap-2.5 text-rose-600 text-xs font-medium shadow-sm overflow-hidden"
            >
              <AlertCircle size={16} className="shrink-0 text-rose-500" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Interactive Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <motion.div variants={itemVariants} className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block pl-1">
              Username / Worker ID
            </label>
            <div className="relative group">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-[#007AFF] transition-colors" />
              <input 
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter assigned username"
                className="w-full pl-10 pr-4 py-3 bg-neutral-50/80 hover:bg-white focus:bg-white border border-black/[0.06] focus:border-[#007AFF]/40 rounded-2xl text-xs font-medium text-neutral-900 outline-none focus:ring-4 focus:ring-[#007AFF]/10 transition-all shadow-sm"
              />
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block pl-1">
              Security Password
            </label>
            <div className="relative group">
              <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-[#007AFF] transition-colors" />
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-3 bg-neutral-50/80 hover:bg-white focus:bg-white border border-black/[0.06] focus:border-[#007AFF]/40 rounded-2xl text-xs font-medium text-neutral-900 outline-none focus:ring-4 focus:ring-[#007AFF]/10 transition-all shadow-sm"
              />
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="pt-2">
            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              disabled={submitting}
              type="submit"
              className="w-full py-3.5 bg-neutral-900 hover:bg-black text-white rounded-2xl text-xs font-semibold shadow-xl shadow-black/10 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group"
            >
              {submitting ? (
                <Loader2 size={16} className="animate-spin text-white" />
              ) : (
                <>
                  <span>Sign In as {selectedRole === 'admin' ? 'Administrator' : 'Worker'}</span>
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </motion.button>
          </motion.div>
        </form>

        {/* Footer Note */}
        <motion.p variants={itemVariants} className="text-[11px] text-center text-neutral-400 font-medium">
          Protected session • Contact admin for credential recovery
        </motion.p>

      </motion.div>
    </div>
  );
}