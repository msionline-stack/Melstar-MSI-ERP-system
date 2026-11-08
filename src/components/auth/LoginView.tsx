import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Shield,
  KeyRound,
  User,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  ArrowRight,
  Lock,
} from 'lucide-react';

interface RoleOption {
  role: string;
  name: string;
  username: string;
}

const STAFF_ROLES: RoleOption[] = [
  { role: 'General Manager', name: 'Mr. Michael Addo', username: 'gm' },
  { role: 'Director', name: 'Mr. Edward Osafo Addo', username: 'director' },
  { role: 'Proprietress', name: 'Mrs. Victoria Osafo Addo', username: 'proprietress' },
  { role: 'Administrator', name: 'Miriam Darbah', username: 'admin' },
  { role: 'Accountant', name: 'Lovia Osei', username: 'accountant' },
  { role: 'Cashier or Fee Collector', name: 'Patience Adjei', username: 'cashier' },
];

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!credential.trim()) {
      setError('Please enter your username, official email, or role.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      await login(credential, password);
    } catch (err: any) {
      setError(err.message || 'Invalid username or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRole = (r: RoleOption) => {
    setCredential(r.username);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-radial from-slate-800 to-slate-950 font-sans antialiased text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* ClassLedger Logo & App Identity */}
        <div className="inline-flex w-24 h-24 rounded-3xl bg-white p-2 items-center justify-center shadow-2xl border-2 border-slate-700/60 mb-3 animate-in fade-in zoom-in-95">
          <img
            src="/assets/aistudio/sda_338456d1.png"
            alt="ClassLedger Logo"
            className="w-full h-full object-contain"
          />
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          ClassLedger
        </h2>
        <p className="mt-1 text-xs font-bold text-emerald-400 uppercase tracking-widest">
          Melstar Children Training Centre
        </p>
        <p className="mt-0.5 text-xs text-amber-300 font-semibold italic">
          "Solid Foundation, Bright Future"
        </p>
        <p className="mt-1 text-xs text-slate-400">
          New Gbawe, Greater Accra • School ERP &amp; Billing Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white text-slate-900 py-8 px-6 sm:px-8 shadow-2xl rounded-3xl border border-slate-200/80">
          <div className="flex items-center justify-between pb-5 border-b border-slate-100 mb-6">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Staff Authentication</h3>
              <p className="text-xs text-slate-500">Sign in with your credentials to access the portal</p>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <Shield className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              Secure RBAC
            </span>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start space-x-2.5 text-xs text-red-700 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Authentication Error</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Quick Role Selector */}
          <div className="mb-5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Role / Staff Account
            </label>
            <div className="grid grid-cols-2 gap-2">
              {STAFF_ROLES.map((r) => {
                const isSelected = credential === r.username || credential === r.role;
                return (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => handleSelectRole(r)}
                    className={`text-left p-2.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-600/20'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-[11px] font-bold text-slate-900 truncate">{r.role}</span>
                    <span className="text-[10px] text-slate-500 truncate mt-0.5">{r.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Username, Role, or Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={credential}
                  onChange={(e) => setCredential(e.target.value)}
                  placeholder="e.g. gm, admin, cashier, or your email"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/10 transition"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">Password</label>
                <span className="text-[11px] text-slate-400 font-medium">Case sensitive</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your confidential password"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/10 transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Authenticating Session...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Access ERP Dashboard</span>
                  <ArrowRight className="w-4 h-4 ml-1 opacity-70" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center space-x-1.5 text-[11px] text-slate-500">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Authorized school personnel access only</span>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-slate-500">
          For account assistance or password resets, contact the School Administration or General Manager.
        </p>

        <p className="mt-6 text-center text-xs text-slate-400 font-medium">
          Designed &amp; Developed by CS Enterprise Systems. © 2026 CS Enterprise Systems. All rights reserved
        </p>
      </div>
    </div>
  );
};
