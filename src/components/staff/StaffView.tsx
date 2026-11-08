import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  UserCog,
  Shield,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  UserCheck,
  Crown,
  KeyRound,
  Lock,
  Save,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import { RoleType, RolePermissions } from '../../types';
import { api } from '../../api/client';

export const StaffView: React.FC = () => {
  const {
    availableUsers,
    currentUser,
    openSwitchRoleModal,
    isGeneralManager,
    allRolePermissions,
    updateRolePermissions,
    updateUserPassword,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'matrix' | 'passwords'>('matrix');
  const [localPermissions, setLocalPermissions] = useState<Record<string, RolePermissions>>({});
  const [savingRole, setSavingRole] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Password editing
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [credentialsList, setCredentialsList] = useState<any[]>([]);

  useEffect(() => {
    if (allRolePermissions && Object.keys(allRolePermissions).length > 0) {
      setLocalPermissions(allRolePermissions);
    }
  }, [allRolePermissions]);

  const fetchCredentials = async () => {
    try {
      const data = await api.getCredentialsSummary();
      setCredentialsList(data);
    } catch (err) {
      console.error('Error fetching credentials summary:', err);
    }
  };

  useEffect(() => {
    fetchCredentials();
  }, [availableUsers]);

  const handleTogglePermission = (role: string, field: keyof RolePermissions) => {
    if (!isGeneralManager) return;
    setLocalPermissions((prev) => {
      const current = prev[role] || {
        role: role as RoleType,
        description: `${role} operational permissions`,
        canViewFinancials: true,
        canCollectPayment: true,
        canMarkAttendance: true,
        canManageStudents: true,
        canManageExpenses: true,
        canReversePayment: true,
        canConfigureSystem: true,
        canCloseDay: true,
        canViewReports: true,
      };

      return {
        ...prev,
        [role]: {
          ...current,
          [field]: !current[field],
        },
      };
    });
  };

  const handleSaveRole = async (role: string) => {
    if (!localPermissions[role]) return;
    setSavingRole(role);
    try {
      await updateRolePermissions(role, localPermissions[role]);
      setSaveSuccess(role);
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err) {
      alert('Failed to save permissions for ' + role);
    } finally {
      setSavingRole(null);
    }
  };

  const handleSavePassword = async (userId: string) => {
    if (!newPassword || newPassword.trim().length < 4) {
      alert('Password must be at least 4 characters');
      return;
    }
    try {
      await updateUserPassword(userId, newPassword);
      setPasswordSuccess(userId);
      setEditingUserId(null);
      setNewPassword('');
      await fetchCredentials();
      setTimeout(() => setPasswordSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update password');
    }
  };

  const rolesOrder: RoleType[] = [
    'General Manager',
    'Director',
    'Proprietress',
    'Administrator',
    'Accountant',
    'Cashier or Fee Collector',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Staff Directory &amp; Role-Based Access Control (RBAC)
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
            Role Governance &amp; Permission Manager
          </h2>
          <p className="text-xs text-slate-500">
            {isGeneralManager
              ? 'General Manager Master Console: You have full access to all roles and can configure what each role can do.'
              : 'Separation of duties across executives, administrators, accountants, and cashiers.'}
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'matrix' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-700" />
            <span>Permissions Matrix</span>
          </button>
          <button
            onClick={() => setActiveTab('passwords')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'passwords' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-600" />
            <span>Role Passwords &amp; Logins</span>
          </button>
        </div>
      </div>

      {/* General Manager Master Authority Banner */}
      {isGeneralManager ? (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 border border-amber-200/80 flex items-start space-x-3.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Crown className="w-5 h-5 text-amber-100" />
          </div>
          <div className="text-xs text-slate-700">
            <p className="font-bold text-slate-900 flex items-center space-x-1.5">
              <span>General Manager Master Authority Active</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                Full Control
              </span>
            </p>
            <p className="mt-0.5 text-slate-600">
              You have unrestricted access across the entire school system. You can toggle what each individual role is allowed to access, reverse, or configure, and edit staff passwords.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center space-x-3 text-xs text-slate-600">
          <Shield className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>
            You are logged in as <strong className="text-slate-900">{currentUser?.name}</strong> ({currentUser?.roleName}). Permission toggles and password overrides are managed exclusively by the <strong>General Manager</strong>.
          </span>
        </div>
      )}

      {/* Staff Directory Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {availableUsers.map((u) => {
          const isCurrent = currentUser?.id === u.id;
          const isGM = u.roleName === 'General Manager';
          const cred = credentialsList.find((c) => c.id === u.id);

          return (
            <div
              key={u.id}
              className={`bg-white rounded-2xl border p-4 shadow-xs transition space-y-3 relative ${
                isCurrent
                  ? 'border-emerald-600 ring-2 ring-emerald-600/20'
                  : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <h3 className="font-bold text-slate-900 text-sm">{u.name}</h3>
                    {isGM && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                  </div>
                  <span
                    className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                      isGM
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-slate-100 text-emerald-800'
                    }`}
                  >
                    {u.roleName}
                  </span>
                </div>
                <div
                  className={`w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-xs ${
                    isGM ? 'bg-amber-600' : 'bg-slate-900'
                  }`}
                >
                  {u.name.charAt(0)}
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-1">
                <div className="flex items-center">
                  <Mail className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                  <span className="truncate">{u.email}</span>
                </div>
                <div className="flex items-center font-mono text-[11px]">
                  <Phone className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                  <span>{u.phone}</span>
                </div>
                {cred && (
                  <div className="flex items-center pt-1 font-mono text-[11px] text-slate-500">
                    <KeyRound className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                    <span>Login: <strong>{cred.username}</strong></span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">
                  ● {u.status}
                </span>

                <button
                  onClick={() => openSwitchRoleModal(u)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center ${
                    isCurrent
                      ? 'bg-emerald-100 text-emerald-800 font-bold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {isCurrent ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5 mr-1 text-emerald-700" />
                      Active Role
                    </>
                  ) : (
                    <>
                      <Lock className="w-3 h-3 mr-1 text-slate-500" />
                      Switch Role
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tab 1: Permissions Matrix */}
      {activeTab === 'matrix' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center space-x-1.5">
                <span>Role Permission Matrix</span>
                {isGeneralManager && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Editable by General Manager
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500">
                {isGeneralManager
                  ? 'Click checkboxes to grant or restrict specific powers for each role, then click Save.'
                  : 'Current capabilities enforced across the school application by role.'}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3 text-center">Financials</th>
                  <th className="py-2.5 px-3 text-center">Collect Payments</th>
                  <th className="py-2.5 px-3 text-center">Attendance</th>
                  <th className="py-2.5 px-3 text-center">Students</th>
                  <th className="py-2.5 px-3 text-center">Expenses</th>
                  <th className="py-2.5 px-3 text-center">Reversals</th>
                  <th className="py-2.5 px-3 text-center">Settings</th>
                  <th className="py-2.5 px-3 text-center">Close Day</th>
                  <th className="py-2.5 px-3 text-center">Reports</th>
                  {isGeneralManager && <th className="py-2.5 px-3 text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rolesOrder.map((role) => {
                  const perms = localPermissions[role] || allRolePermissions[role] || {
                    role,
                    description: '',
                    canViewFinancials: true,
                    canCollectPayment: true,
                    canMarkAttendance: true,
                    canManageStudents: true,
                    canManageExpenses: true,
                    canReversePayment: true,
                    canConfigureSystem: true,
                    canCloseDay: true,
                    canViewReports: true,
                  };
                  const isGM = role === 'General Manager';

                  const renderCheckbox = (field: keyof RolePermissions) => {
                    const val = !!perms[field];
                    if (isGM) {
                      // GM has unconditional access
                      return (
                        <div className="flex justify-center" title="General Manager always has master access">
                          <CheckCircle2 className="w-4 h-4 text-amber-500" />
                        </div>
                      );
                    }

                    if (!isGeneralManager) {
                      return (
                        <div className="flex justify-center">
                          {val ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-slate-300" />
                          )}
                        </div>
                      );
                    }

                    return (
                      <div className="flex justify-center">
                        <input
                          type="checkbox"
                          checked={val}
                          onChange={() => handleTogglePermission(role, field)}
                          className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                        />
                      </div>
                    );
                  };

                  return (
                    <tr key={role} className={`hover:bg-slate-50 ${isGM ? 'bg-amber-50/20' : ''}`}>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                          <span>{role}</span>
                          {isGM && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                        </div>
                        <div className="text-[10px] text-slate-500 max-w-xs">{perms.description}</div>
                      </td>
                      <td className="py-3 px-3 text-center">{renderCheckbox('canViewFinancials')}</td>
                      <td className="py-3 px-3 text-center">{renderCheckbox('canCollectPayment')}</td>
                      <td className="py-3 px-3 text-center">{renderCheckbox('canMarkAttendance')}</td>
                      <td className="py-3 px-3 text-center">{renderCheckbox('canManageStudents')}</td>
                      <td className="py-3 px-3 text-center">{renderCheckbox('canManageExpenses')}</td>
                      <td className="py-3 px-3 text-center">{renderCheckbox('canReversePayment')}</td>
                      <td className="py-3 px-3 text-center">{renderCheckbox('canConfigureSystem')}</td>
                      <td className="py-3 px-3 text-center">{renderCheckbox('canCloseDay')}</td>
                      <td className="py-3 px-3 text-center">{renderCheckbox('canViewReports')}</td>
                      {isGeneralManager && (
                        <td className="py-3 px-3 text-center">
                          {isGM ? (
                            <span className="text-[10px] font-bold text-amber-600">Master</span>
                          ) : (
                            <button
                              onClick={() => handleSaveRole(role)}
                              disabled={savingRole === role}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center mx-auto space-x-1 ${
                                saveSuccess === role
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {saveSuccess === role ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>Saved</span>
                                </>
                              ) : savingRole === role ? (
                                <span>Saving...</span>
                              ) : (
                                <>
                                  <Save className="w-3 h-3 text-emerald-700" />
                                  <span>Save</span>
                                </>
                              )}
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Passwords & Credentials Console */}
      {activeTab === 'passwords' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center space-x-1.5">
              <KeyRound className="w-4 h-4 text-emerald-700" />
              <span>Role Passwords &amp; Login Access Directory</span>
            </h3>
            <p className="text-xs text-slate-500">
              Each staff role has dedicated credentials. As General Manager, you can view, reset, or update any role's password below.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {credentialsList.map((cred) => {
              const isGM = cred.roleName === 'General Manager';
              const isEditing = editingUserId === cred.id;

              return (
                <div
                  key={cred.id}
                  className={`p-4 rounded-2xl border transition space-y-3 ${
                    isGM ? 'bg-amber-50/50 border-amber-200' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-slate-900 text-sm">{cred.roleName}</span>
                        {isGM && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                      </div>
                      <span className="text-xs text-slate-600">{cred.name}</span>
                    </div>
                    <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-500">
                      ID: {cred.id}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Username:</span>
                      <span className="font-mono font-bold text-slate-800">{cred.username}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Email:</span>
                      <span className="font-mono text-slate-700 text-[11px] truncate">{cred.email}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Password:</span>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {cred.password}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isGeneralManager && (
                    <div className="pt-2 border-t border-slate-200/60">
                      {isEditing ? (
                        <div className="space-y-2">
                          <label className="block text-[11px] font-bold text-slate-700">Set New Password:</label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="New password (e.g. Melstar@2026)"
                              className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:border-emerald-600"
                            />
                            <button
                              onClick={() => handleSavePassword(cred.id)}
                              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingUserId(null);
                                setNewPassword('');
                              }}
                              className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          {passwordSuccess === cred.id ? (
                            <span className="text-[10px] font-bold text-emerald-600 flex items-center">
                              <Check className="w-3.5 h-3.5 mr-1" /> Password updated!
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Authorized GM control</span>
                          )}
                          <button
                            onClick={() => {
                              setEditingUserId(cred.id);
                              setNewPassword(cred.password);
                            }}
                            className="text-xs text-emerald-700 hover:text-emerald-900 font-bold hover:underline cursor-pointer"
                          >
                            Edit Password
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
