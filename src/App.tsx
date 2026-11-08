import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { StudentsView } from './components/students/StudentsView';
import { ClassesView } from './components/classes/ClassesView';
import { AttendanceView } from './components/attendance/AttendanceView';
import { DailyFeedingView } from './components/feeding/DailyFeedingView';
import { WeeklyFeedingView } from './components/feeding/WeeklyFeedingView';
import { ClassFeesView } from './components/classfees/ClassFeesView';
import { PaymentHistoryView } from './components/payments/PaymentHistoryView';
import { OutstandingFeesView } from './components/outstanding/OutstandingFeesView';
import { FeedingExpensesView } from './components/expenses/FeedingExpensesView';
import { DailyOperationsView } from './components/operations/DailyOperationsView';
import { WeeklyReportView } from './components/reports/WeeklyReportView';
import { StaffView } from './components/staff/StaffView';
import { GoogleSheetsSettingsView } from './components/settings/GoogleSheetsSettingsView';
import { CollectPaymentModal } from './components/payments/CollectPaymentModal';
import { LoginView } from './components/auth/LoginView';
import { SwitchRoleModal } from './components/auth/SwitchRoleModal';

const MainLayout: React.FC = () => {
  const { pendingSwitchUser, closeSwitchRoleModal } = useAuth();
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [collectPaymentOpen, setCollectPaymentOpen] = useState(false);
  const [targetStudentId, setTargetStudentId] = useState<string | undefined>(undefined);

  const handleOpenCollectPayment = (studentId?: string) => {
    setTargetStudentId(studentId);
    setCollectPaymentOpen(true);
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <DashboardView
            onNavigate={setActiveView}
            onOpenCollectPayment={() => handleOpenCollectPayment()}
          />
        );
      case 'students':
        return <StudentsView onOpenCollectPaymentForStudent={handleOpenCollectPayment} />;
      case 'classes':
        return <ClassesView />;
      case 'attendance':
        return <AttendanceView />;
      case 'feeding-daily':
        return <DailyFeedingView onOpenCollectPayment={handleOpenCollectPayment} />;
      case 'feeding-weekly':
        return <WeeklyFeedingView />;
      case 'class-fees':
        return <ClassFeesView onOpenCollectPayment={handleOpenCollectPayment} />;
      case 'collect-payment':
        return (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-lg mx-auto my-12 space-y-4">
            <h3 className="text-lg font-black text-slate-900">Payment Collection Terminal</h3>
            <p className="text-xs text-slate-500">
              Open the dedicated payment modal to process student feeding and tuition receipts.
            </p>
            <button
              onClick={() => handleOpenCollectPayment()}
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              Open Payment Terminal
            </button>
          </div>
        );
      case 'payment-history':
        return <PaymentHistoryView />;
      case 'outstanding':
        return <OutstandingFeesView onOpenCollectPayment={handleOpenCollectPayment} />;
      case 'feeding-expenses':
        return <FeedingExpensesView />;
      case 'daily-closing':
        return <DailyOperationsView />;
      case 'weekly-report':
        return <WeeklyReportView />;
      case 'staff':
        return <StaffView />;
      case 'settings':
        return <GoogleSheetsSettingsView />;
      default:
        return (
          <DashboardView
            onNavigate={setActiveView}
            onOpenCollectPayment={() => handleOpenCollectPayment()}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 antialiased selection:bg-emerald-100 selection:text-emerald-900">
      <Navbar
        onOpenCollectPayment={() => handleOpenCollectPayment()}
        activeView={activeView}
        setActiveView={setActiveView}
      />

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <Sidebar activeView={activeView} setActiveView={setActiveView} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-between">
          <div className="max-w-7xl mx-auto w-full">{renderActiveView()}</div>
          <footer className="mt-12 pt-6 pb-2 border-t border-slate-200/80 text-center text-xs text-slate-500 font-medium print:hidden">
            Designed &amp; Developed by CS Enterprise Systems. © 2026 CS Enterprise Systems. All rights reserved
          </footer>
        </main>
      </div>

      {/* Collect Payment Global Modal */}
      <CollectPaymentModal
        isOpen={collectPaymentOpen}
        onClose={() => {
          setCollectPaymentOpen(false);
          setTargetStudentId(undefined);
        }}
        preselectedStudentId={targetStudentId}
        onPaymentSuccess={() => {
          // Keep receipt open until user closes it
        }}
      />

      {/* Role Switch Security Gate Modal */}
      <SwitchRoleModal
        isOpen={!!pendingSwitchUser}
        targetUser={pendingSwitchUser}
        onClose={closeSwitchRoleModal}
      />
    </div>
  );
};

const AppContent: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
          Loading ClassLedger ERP...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return <MainLayout />;
};

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
