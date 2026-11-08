import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Shield,
  CreditCard,
  UserCheck,
  ChevronDown,
  Clock,
  Sparkles,
  Sheet,
  LogOut,
  Crown,
  KeyRound,
  Sliders,
  Lock,
} from 'lucide-react';
import { useGmtClock } from '../../utils/dateUtils';

interface NavbarProps {
  onOpenCollectPayment: () => void;
  activeView: string;
  setActiveView: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCollectPayment, setActiveView }) => {
  const gmtClock = useGmtClock();
  const {
    currentUser,
    availableUsers,
    openSwitchRoleModal,
    canCollectPayment,
    isGeneralManager,
    logout,
  } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs print:hidden">
      <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        {/* Left: Brand & School Identity */}
        <div className="flex items-center space-x-3">
          <img
            src="/assets/aistudio/sda_338456d1.png"
            alt="ClassLedger Logo"
            className="w-10 h-10 object-contain rounded-xl shadow-xs border border-slate-200/80 bg-white p-0.5"
          />
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-black text-slate-900 text-base leading-tight tracking-tight">
                ClassLedger
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
                ERP v2.5
              </span>
              <span className="text-slate-300 hidden md:inline">•</span>
              <span className="text-xs font-semibold text-slate-700 hidden md:inline truncate">
                Melstar Children Training Centre
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              New Gbawe, Greater Accra •{' '}
              <span className="italic text-emerald-700 font-semibold">"Solid Foundation, Bright Future"</span>
            </p>
          </div>
        </div>

        {/* Right: Quick actions, Live Date, and Role Switcher */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Live GMT Clock & Date Indicator */}
          <div
            className="hidden lg:flex items-center space-x-2 text-xs bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 select-none"
            title="School Operational Time: Greenwich Mean Time (Ghana Standard Time)"
          >
            <Clock className="w-3.5 h-3.5 text-emerald-600 animate-pulse shrink-0" />
            <div className="flex items-center space-x-1.5 font-medium">
              <span className="font-bold text-slate-800">{gmtClock.termName}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-700">{gmtClock.dateFormatted}</span>
              <span className="text-slate-300">•</span>
              <span className="font-mono text-emerald-800 font-bold bg-emerald-100/70 px-1.5 py-0.5 rounded text-[11px] border border-emerald-200/80">
                {gmtClock.timeFormatted} GMT
              </span>
            </div>
          </div>

          {/* Google Sheets Status Link */}
          <button
            onClick={() => setActiveView('settings')}
            className="hidden md:flex items-center space-x-1.5 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-2.5 py-1.5 rounded-lg border border-emerald-200 transition cursor-pointer"
            title="Google Sheets Database Integration"
          >
            <Sheet className="w-3.5 h-3.5 text-emerald-700" />
            <span className="font-semibold">Sheets DB</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </button>

          {/* Collect Payment Shortcut */}
          {canCollectPayment && (
            <button
              onClick={onOpenCollectPayment}
              className="inline-flex items-center px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5 mr-1.5 text-amber-300" />
              Collect Payment
            </button>
          )}

          {/* Role Switcher Menu */}
          <div className="relative group">
            <div
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border cursor-pointer transition ${
                isGeneralManager
                  ? 'bg-amber-50/80 border-amber-300 hover:bg-amber-100/80'
                  : 'bg-slate-100 hover:bg-slate-200/80 border-slate-200'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full text-white flex items-center justify-center text-[10px] font-bold ${
                  isGeneralManager ? 'bg-amber-600' : 'bg-slate-800'
                }`}
              >
                {isGeneralManager ? <Crown className="w-3.5 h-3.5 text-amber-100" /> : currentUser?.name.charAt(0)}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-semibold text-slate-800 leading-none flex items-center space-x-1">
                  <span>{currentUser?.name}</span>
                </div>
                <div
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    isGeneralManager ? 'text-amber-700' : 'text-emerald-700'
                  }`}
                >
                  {currentUser?.roleName}
                  {isGeneralManager && ' • Master Access'}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </div>

            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-1 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 hidden group-hover:block hover:block z-50 animate-in fade-in slide-in-from-top-1">
              <div className="px-3 py-2 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Switch / Test Role</span>
                <Sparkles className="w-3 h-3 text-amber-500" />
              </div>

              <div className="max-h-60 overflow-y-auto divide-y divide-slate-50">
                {availableUsers.map((u) => {
                  const isCurrent = currentUser?.id === u.id;
                  const isGM = u.roleName === 'General Manager';

                  return (
                    <button
                      key={u.id}
                      onClick={() => openSwitchRoleModal(u)}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition cursor-pointer ${
                        isCurrent ? 'bg-emerald-50/80 font-bold text-emerald-900' : 'text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-slate-900 flex items-center space-x-1">
                          <span>{u.name}</span>
                          {isGM && <Crown className="w-3 h-3 text-amber-500" />}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center space-x-1">
                          <span>{u.roleName}</span>
                          {!isCurrent && <Lock className="w-2.5 h-2.5 text-slate-400 ml-1" />}
                        </div>
                      </div>
                      {isCurrent ? (
                        <UserCheck className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <span className="text-[10px] text-emerald-700 font-semibold px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                          Verify
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {isGeneralManager && (
                <div className="px-3 pt-2 pb-1 border-t border-slate-100">
                  <button
                    onClick={() => setActiveView('staff')}
                    className="w-full py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg text-[11px] font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5 text-amber-600" />
                    <span>Manage Role Permissions</span>
                  </button>
                </div>
              )}

              <div className="px-3 pt-2 pb-1 border-t border-slate-100">
                <button
                  onClick={logout}
                  className="w-full py-1.5 px-2 hover:bg-red-50 text-red-700 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out of Session</span>
                </button>
              </div>
            </div>
          </div>

          {/* Dedicated Logout Icon Button */}
          <button
            onClick={logout}
            className="p-2 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg border border-slate-200 transition cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
