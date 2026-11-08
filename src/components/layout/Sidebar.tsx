import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CalendarCheck,
  UtensilsCrossed,
  CalendarDays,
  Coins,
  CreditCard,
  Receipt,
  AlertCircle,
  ShoppingBag,
  FileCheck2,
  FileSpreadsheet,
  UserCog,
  Settings,
  Lock,
  LogOut,
  Crown,
  Sliders,
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  const {
    currentUser,
    isGeneralManager,
    canViewFinancials,
    canManageStudents,
    canConfigureSystem,
    canManageExpenses,
    canCloseDay,
    canViewReports,
    logout,
  } = useAuth();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      restricted: false,
    },
    {
      id: 'students',
      label: 'Students Register',
      icon: Users,
      restricted: !canManageStudents && !canViewFinancials,
    },
    {
      id: 'classes',
      label: 'Classes & Fee Rates',
      icon: GraduationCap,
      restricted: false,
    },
    {
      id: 'attendance',
      label: 'Attendance Register',
      icon: CalendarCheck,
      restricted: false,
    },
    {
      id: 'feeding-daily',
      label: 'Daily Feeding Fees',
      icon: UtensilsCrossed,
      restricted: false,
      badge: 'Daily',
    },
    {
      id: 'feeding-weekly',
      label: 'Weekly Feeding Register',
      icon: CalendarDays,
      restricted: false,
    },
    {
      id: 'class-fees',
      label: 'Class Fees / Tuition',
      icon: Coins,
      restricted: !canViewFinancials,
    },
    {
      id: 'collect-payment',
      label: 'Collect Payment',
      icon: CreditCard,
      restricted: !canViewFinancials,
      badge: 'Cashier',
    },
    {
      id: 'payment-history',
      label: 'Payment History & Receipts',
      icon: Receipt,
      restricted: !canViewFinancials,
    },
    {
      id: 'outstanding',
      label: 'Outstanding Fees',
      icon: AlertCircle,
      restricted: !canViewFinancials,
    },
    {
      id: 'feeding-expenses',
      label: 'Feeding Operations & Cost',
      icon: ShoppingBag,
      restricted: !canManageExpenses && !canViewFinancials,
    },
    {
      id: 'daily-closing',
      label: 'Daily Operations & Closing',
      icon: FileCheck2,
      restricted: !canCloseDay && !canViewFinancials,
    },
    {
      id: 'weekly-report',
      label: 'Management Reports',
      icon: FileSpreadsheet,
      restricted: !canViewReports && !canViewFinancials,
    },
    {
      id: 'staff',
      label: 'Role Permissions & Staff',
      icon: isGeneralManager ? Sliders : UserCog,
      restricted: false,
      badge: isGeneralManager ? 'Admin' : undefined,
    },
    {
      id: 'settings',
      label: 'Google Sheets & Settings',
      icon: Settings,
      restricted: !canConfigureSystem,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-[calc(100vh-65px)] border-r border-slate-800 print:hidden select-none">
      <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <img
            src="/assets/aistudio/sda_338456d1.png"
            alt="ClassLedger"
            className="w-7 h-7 object-contain rounded-lg bg-white p-0.5 shadow-xs"
          />
          <div>
            <div className="text-xs font-black tracking-tight text-white leading-tight">
              ClassLedger
            </div>
            <div className="text-[10px] text-slate-400 font-medium">Melstar Centre ERP</div>
          </div>
        </div>
        {isGeneralManager && (
          <span className="flex items-center text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded">
            <Crown className="w-3 h-3 mr-1 text-amber-400" />
            GM
          </span>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          if (item.restricted) {
            return (
              <div
                key={item.id}
                className="flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-600 rounded-lg cursor-not-allowed opacity-50"
                title="Restricted for your active role"
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-4 h-4 text-slate-600" />
                  <span>{item.label}</span>
                </div>
                <Lock className="w-3.5 h-3.5 text-slate-600" />
              </div>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-700 text-white shadow-xs font-bold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3 truncate">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-amber-300' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${
                    isActive
                      ? 'bg-emerald-900 text-emerald-200'
                      : 'bg-slate-800 text-emerald-400 border border-emerald-900/50'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Staff User Info & Logout Button */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="truncate">
            <div className="text-xs font-bold text-white truncate flex items-center space-x-1">
              <span>{currentUser?.name}</span>
              {isGeneralManager && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
            </div>
            <div className="text-[10px] text-emerald-400 font-semibold truncate">
              {currentUser?.roleName}
            </div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-red-400 rounded-lg transition cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
