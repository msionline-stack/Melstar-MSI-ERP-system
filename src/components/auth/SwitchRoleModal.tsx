import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types';
import {
  ShieldAlert,
  KeyRound,
  Eye,
  EyeOff,
  X,
  CheckCircle2,
  AlertCircle,
  Crown,
  Lock,
  ArrowRight,
} from 'lucide-react';

interface SwitchRoleModalProps {
  isOpen: boolean;
  targetUser: User | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SwitchRoleModal: React.FC<SwitchRoleModalProps> = ({
  isOpen,
  targetUser,
  onClose,
  onSuccess,
}) => {
  const { switchUser } = useAuth();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, targetUser]);

  if (!isOpen || !targetUser) return null;

  const isGM = targetUser.roleName === 'General Manager';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError(`Please enter the password for ${targetUser.roleName}.`);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await switchUser(targetUser.id, password);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Incorrect password for this role.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-700/80 border border-emerald-500/40 flex items-center justify-center text-amber-300">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight">Role Switch Security Gate</h3>
              <p className="text-[11px] text-slate-400">Password required to switch session</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target Role Card */}
        <div className="p-5 space-y-4">
          <div
            className={`p-3.5 rounded-2xl border flex items-start space-x-3 ${
              isGM ? 'bg-amber-50/70 border-amber-200' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-xs ${
                isGM ? 'bg-amber-600' : 'bg-slate-900'
              }`}
            >
              {isGM ? <Crown className="w-4 h-4 text-amber-100" /> : targetUser.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-slate-900 text-xs truncate">{targetUser.name}</span>
                {isGM && <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
              </div>
              <div className="text-[11px] text-emerald-800 font-bold uppercase tracking-wider">
                {targetUser.roleName}
              </div>
              <div className="text-[10px] text-slate-500 font-mono truncate">{targetUser.email}</div>
            </div>
          </div>

          <div className="text-xs text-slate-600">
            To prevent unauthorized access, enter the password assigned to{' '}
            <strong className="text-slate-900 font-semibold">{targetUser.name} ({targetUser.roleName})</strong>:
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start space-x-2 text-xs text-red-700 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {targetUser.roleName} Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  ref={inputRef}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={`Enter ${targetUser.roleName} password`}
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/10 transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Verify &amp; Switch Role</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
