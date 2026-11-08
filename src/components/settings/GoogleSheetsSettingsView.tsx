import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  Sheet,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Download,
  Key,
  ShieldCheck,
  ExternalLink,
  Layers,
  Sparkles,
  Database,
  ArrowRight,
} from 'lucide-react';

export const GoogleSheetsSettingsView: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [serviceAccountEmail, setServiceAccountEmail] = useState('');
  const [privateKey, setPrivateKey] = useState('');

  // Actions state
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [runningTest, setRunningTest] = useState(false);
  const [controlledTestResult, setControlledTestResult] = useState<any>(null);
  const [initializing, setInitializing] = useState(false);
  const [initResult, setInitResult] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const data = await api.getGoogleSheetsStatus();
      setStatus(data);
      if (data.spreadsheetId) setSpreadsheetId(data.spreadsheetId);
      if (data.serviceAccountEmail) setServiceAccountEmail(data.serviceAccountEmail);
    } catch (err) {
      console.error('Failed to load Google Sheets status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.configureGoogleSheets({
        spreadsheetId,
        serviceAccountEmail,
        privateKey: privateKey || undefined,
      });
      alert('Google Sheets configuration updated in server environment!');
      loadStatus();
    } catch (err: any) {
      alert(err.message || 'Failed to save config');
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.testGoogleSheetsConnection();
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setTesting(false);
    }
  };

  const handleControlledTest = async () => {
    setRunningTest(true);
    setControlledTestResult(null);
    try {
      const res = await api.runControlledTest();
      setControlledTestResult(res);
    } catch (err: any) {
      setControlledTestResult({ success: false, message: err.message });
    } finally {
      setRunningTest(false);
    }
  };

  const handleInitSheets = async () => {
    setInitializing(true);
    setInitResult(null);
    try {
      const res = await api.initGoogleSheets();
      setInitResult(res);
    } catch (err: any) {
      setInitResult({ success: false, message: err.message });
    } finally {
      setInitializing(false);
    }
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await api.syncAllToGoogleSheets();
      setSyncResult(res);
    } catch (err: any) {
      setSyncResult({ success: false, message: err.message });
    } finally {
      setSyncing(false);
    }
  };

  const worksheetsList = [
    'Settings', 'Users', 'Roles', 'Students', 'Classes', 'AcademicYears',
    'AcademicTerms', 'SchoolCalendar', 'FeeCategories', 'FeeSchedules',
    'FeeObligations', 'FeeAdjustments', 'Payments', 'PaymentAllocations',
    'PaymentReversals', 'Attendance', 'FeedingExpenses', 'ExpenseCategories',
    'DailyClosings', 'CashierSessions', 'CashierMovements', 'Notifications',
    'AuditLogs', 'TransactionJournal', 'DataImportLogs'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Primary Cloud Database Engine
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
            Google Sheets Integration &amp; Master Database
          </h2>
          <p className="text-xs text-slate-500">
            Secure Google Service Account connection to the 25 official Melstar ERP worksheets
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <a
            href="/api/backup/export"
            download="melstar_erp_backup.json"
            className="inline-flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Download Full JSON Backup
          </a>
        </div>
      </div>

      {/* Connection Status Box */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Sheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Active Database Mode</h3>
              <p className="text-xs text-slate-500">
                {status?.isConfigured
                  ? 'Connected via Google Service Account (Secure Backend Proxy)'
                  : 'Operating in High-Performance Local JSON Persistent Storage with Google Sheets Sync Ready'}
              </p>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              status?.isConfigured
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-teal-100 text-teal-800'
            }`}
          >
            {status?.isConfigured ? 'Live Google Sheets Mode' : 'Local Persistent Storage Mode'}
          </span>
        </div>

        {/* Security Assurance Banner */}
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 flex items-start space-x-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">Enterprise Security Architecture:</strong> All Google Sheets API
            calls and service account authentication tokens are strictly handled server-side via Node.js.
            Service account keys are never exposed in browser assets or client JavaScript.
          </div>
        </div>
      </div>

      {/* Two Column Layout: Configuration & Setup Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Live Configuration Form */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center">
            <Key className="w-4 h-4 mr-2 text-emerald-700" />
            Service Account &amp; Spreadsheet Configuration
          </h3>

          <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Google Spreadsheet ID
              </label>
              <input
                type="text"
                value={spreadsheetId}
                onChange={(e) => setSpreadsheetId(e.target.value)}
                placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
              />
              <span className="text-[10px] text-slate-400">
                Found in sheet URL: docs.google.com/spreadsheets/d/<strong>&lt;SPREADSHEET_ID&gt;</strong>/edit
              </span>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Google Service Account Email
              </label>
              <input
                type="text"
                value={serviceAccountEmail}
                onChange={(e) => setServiceAccountEmail(e.target.value)}
                placeholder="e.g. melstar-erp-sa@project-id.iam.gserviceaccount.com"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
              />
              <span className="text-[10px] text-slate-400">
                Ensure you share your master spreadsheet with this email as <strong>Editor</strong>.
              </span>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Service Account Private Key (PEM format)
              </label>
              <textarea
                rows={3}
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                placeholder="-----BEGIN PRIVATE KEY----- ... -----END PRIVATE KEY-----"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px] focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
              />
              <span className="text-[10px] text-slate-400">
                {status?.privateKeyConfigured
                  ? '● Private key already loaded on backend server'
                  : 'Paste your service account private key JSON property here'}
              </span>
            </div>

            <div className="pt-2 flex flex-wrap gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg transition cursor-pointer shadow-xs"
              >
                Save Backend Configuration
              </button>

              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg transition cursor-pointer flex items-center"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${testing ? 'animate-spin' : ''}`} />
                Test Connection
              </button>

              <button
                type="button"
                onClick={handleControlledTest}
                disabled={runningTest}
                className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white font-semibold rounded-lg transition cursor-pointer flex items-center shadow-xs"
              >
                <Sparkles className={`w-3.5 h-3.5 mr-1.5 ${runningTest ? 'animate-spin' : ''}`} />
                {runningTest ? 'Testing Write & Read-back...' : 'Controlled Test (Write & Read-back)'}
              </button>
            </div>
          </form>

          {/* Test Result Message */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs ${
                testResult.success
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : 'bg-rose-50 text-rose-900 border-rose-200'
              }`}
            >
              <div className="font-bold flex items-center">
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" />
                ) : (
                  <XCircle className="w-4 h-4 mr-1 text-rose-600" />
                )}
                {testResult.success ? 'Connection Verified' : 'Connection Failed'}
              </div>
              <div className="mt-1 text-[11px]">{testResult.message}</div>
              {testResult.existingSheets && (
                <div className="mt-2 text-[10px] text-slate-600">
                  Spreadsheet Tabs: {testResult.existingSheets.join(', ')}
                </div>
              )}
            </div>
          )}

          {/* Controlled Write & Read-back Test Result */}
          {controlledTestResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                controlledTestResult.success
                  ? 'bg-indigo-50 text-indigo-950 border-indigo-200'
                  : 'bg-rose-50 text-rose-950 border-rose-200'
              }`}
            >
              <div className="font-bold flex items-center justify-between">
                <span className="flex items-center">
                  {controlledTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 mr-1.5 text-indigo-600" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-1.5 text-rose-600" />
                  )}
                  {controlledTestResult.success ? 'Controlled Write & Read-back PASSED' : 'Controlled Test Failed'}
                </span>
                {controlledTestResult.durationMs && (
                  <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-indigo-200 font-mono">
                    {controlledTestResult.durationMs}ms
                  </span>
                )}
              </div>
              <p className="text-[11px] leading-relaxed">{controlledTestResult.message}</p>
              {controlledTestResult.writtenData && (
                <div className="bg-white/80 p-2.5 rounded-lg border border-indigo-100 font-mono text-[10px] space-y-1">
                  <div><strong>Written ID:</strong> {controlledTestResult.writtenData.id}</div>
                  <div><strong>Tab Target:</strong> TransactionJournal</div>
                  <div><strong>Read Back Status:</strong> {controlledTestResult.readBackData?.status || 'Verified'}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Google Sheets Operations (Initialize & Sync) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center">
            <Database className="w-4 h-4 mr-2 text-blue-700" />
            Spreadsheet Schema &amp; Data Sync
          </h3>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
            <h4 className="font-bold text-slate-800">1. Initialize 25 Worksheets</h4>
            <p className="text-slate-600">
              Automatically creates all missing worksheets with standard columns (Settings, Students, Classes,
              Attendance, Payments, FeedingExpenses, etc.) in your master Google Spreadsheet.
            </p>
            <button
              onClick={handleInitSheets}
              disabled={initializing}
              className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white rounded-lg font-semibold transition cursor-pointer shadow-xs flex items-center text-xs"
            >
              <Layers className="w-3.5 h-3.5 mr-1.5" />
              {initializing ? 'Initializing Sheets...' : 'Initialize 25 Worksheets'}
            </button>
            {initResult && (
              <div className="text-[11px] font-semibold text-blue-900 bg-blue-50 p-2 rounded mt-2 border border-blue-200">
                {initResult.message}
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
            <h4 className="font-bold text-slate-800">2. Export &amp; Sync ERP Data</h4>
            <p className="text-slate-600">
              Exports all active students, class rosters, attendance records, feeding payments, and kitchen
              expenses to your master Google Spreadsheet.
            </p>
            <button
              onClick={handleSyncAll}
              disabled={syncing}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-lg font-semibold transition cursor-pointer shadow-xs flex items-center text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing Records...' : 'Sync All ERP Records to Sheets'}
            </button>
            {syncResult && (
              <div className="text-[11px] font-semibold text-emerald-900 bg-emerald-50 p-2 rounded mt-2 border border-emerald-200">
                {syncResult.message}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 25 Standardized Worksheets Specification Grid */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-slate-900">
          The 25 Master Worksheets Specification (Section 16 Architecture)
        </h3>
        <p className="text-xs text-slate-500">
          Standardized tables managed by Melstar ERP in Google Sheets:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-xs font-mono">
          {worksheetsList.map((name, i) => (
            <div
              key={name}
              className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center space-x-2 text-slate-800"
            >
              <span className="text-[10px] text-slate-400 font-bold w-4">{i + 1}</span>
              <span className="font-semibold truncate">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
