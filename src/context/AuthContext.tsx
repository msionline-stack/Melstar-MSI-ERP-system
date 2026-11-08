import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, RoleType, RolePermissions } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  availableUsers: User[];
  allRolePermissions: Record<string, RolePermissions>;
  currentPermissions: RolePermissions | null;
  loading: boolean;
  login: (emailOrRole: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchUser: (userId: string, password: string) => Promise<void>;
  pendingSwitchUser: User | null;
  openSwitchRoleModal: (targetUser: User) => void;
  closeSwitchRoleModal: () => void;
  updateRolePermissions: (role: string, perms: Partial<RolePermissions>) => Promise<void>;
  updateUserPassword: (userId: string, newPassword: string) => Promise<void>;
  // Dynamic Role Permissions
  isGeneralManager: boolean;
  canManageRoles: boolean;
  canViewFinancials: boolean;
  canCollectPayment: boolean;
  canMarkAttendance: boolean;
  canManageStudents: boolean;
  canManageExpenses: boolean;
  canReversePayment: boolean;
  canConfigureSystem: boolean;
  canCloseDay: boolean;
  canViewReports: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [allRolePermissions, setAllRolePermissions] = useState<Record<string, RolePermissions>>({});
  const [currentPermissions, setCurrentPermissions] = useState<RolePermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingSwitchUser, setPendingSwitchUser] = useState<User | null>(null);

  const fetchSession = async () => {
    try {
      const data = await api.getMe();
      setAvailableUsers(data.availableUsers || []);
      if (data.allRolePermissions) {
        setAllRolePermissions(data.allRolePermissions);
      }

      // Check if user has explicitly logged out
      const loggedOut = localStorage.getItem('melstar_logged_out');
      if (loggedOut === 'true') {
        setCurrentUser(null);
        setCurrentPermissions(null);
      } else if (data.user) {
        setCurrentUser(data.user);
        if (data.permissions) {
          setCurrentPermissions(data.permissions);
        } else if (data.allRolePermissions && data.allRolePermissions[data.user.roleName]) {
          setCurrentPermissions(data.allRolePermissions[data.user.roleName]);
        }
      }
    } catch (err) {
      console.error('Failed to load session:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const login = async (emailOrRole: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.login(emailOrRole, password);
      setCurrentUser(res.user);
      if (res.permissions) setCurrentPermissions(res.permissions);
      if (res.allRolePermissions) setAllRolePermissions(res.allRolePermissions);
      localStorage.removeItem('melstar_logged_out');
      localStorage.setItem('melstar_session_user_id', res.user.id);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setCurrentUser(null);
      setCurrentPermissions(null);
      localStorage.setItem('melstar_logged_out', 'true');
      localStorage.removeItem('melstar_session_user_id');
    }
  };

  const openSwitchRoleModal = (targetUser: User) => {
    // If attempting to switch to self, ignore
    if (currentUser?.id === targetUser.id) return;
    setPendingSwitchUser(targetUser);
  };

  const closeSwitchRoleModal = () => {
    setPendingSwitchUser(null);
  };

  const handleSwitchUser = async (userId: string, password: string) => {
    try {
      const res = await api.switchUser(userId, password);
      setCurrentUser(res.user);
      if (res.permissions) setCurrentPermissions(res.permissions);
      if (res.allRolePermissions) setAllRolePermissions(res.allRolePermissions);
      localStorage.removeItem('melstar_logged_out');
      localStorage.setItem('melstar_session_user_id', res.user.id);
      setPendingSwitchUser(null);
    } catch (err) {
      console.error('Error switching user:', err);
      throw err;
    }
  };

  const handleUpdateRolePermissions = async (role: string, perms: Partial<RolePermissions>) => {
    try {
      const res = await api.updateRolePermissions(role, perms);
      if (res.allRolePermissions) {
        setAllRolePermissions(res.allRolePermissions);
        if (currentUser && currentUser.roleName === role) {
          setCurrentPermissions(res.allRolePermissions[role]);
        }
      }
    } catch (err) {
      console.error('Error updating role permissions:', err);
      throw err;
    }
  };

  const handleUpdateUserPassword = async (userId: string, newPassword: string) => {
    try {
      await api.updateUserPassword(userId, newPassword);
      const data = await api.getMe();
      setAvailableUsers(data.availableUsers || []);
    } catch (err) {
      console.error('Error updating user password:', err);
      throw err;
    }
  };

  const role: RoleType | undefined = currentUser?.roleName;
  const isGeneralManager = role === 'General Manager';
  const isExecutive = role === 'Director' || role === 'Proprietress' || isGeneralManager;

  const activePerms = (role && allRolePermissions[role]) || currentPermissions;

  const canManageRoles = isGeneralManager;
  const canViewFinancials = isGeneralManager || (activePerms ? activePerms.canViewFinancials : true);
  const canCollectPayment = isGeneralManager || (activePerms ? activePerms.canCollectPayment : isExecutive || role === 'Cashier or Fee Collector');
  const canMarkAttendance = isGeneralManager || (activePerms ? activePerms.canMarkAttendance : true);
  const canManageStudents = isGeneralManager || (activePerms ? activePerms.canManageStudents : isExecutive || role === 'Administrator');
  const canManageExpenses = isGeneralManager || (activePerms ? activePerms.canManageExpenses : isExecutive || role === 'Accountant');
  const canReversePayment = isGeneralManager || (activePerms ? activePerms.canReversePayment : isExecutive || role === 'Accountant');
  const canConfigureSystem = isGeneralManager || (activePerms ? activePerms.canConfigureSystem : isExecutive || role === 'Administrator');
  const canCloseDay = isGeneralManager || (activePerms ? activePerms.canCloseDay : isExecutive || role === 'Administrator');
  const canViewReports = isGeneralManager || (activePerms ? activePerms.canViewReports : isExecutive || role === 'Accountant');

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        availableUsers,
        allRolePermissions,
        currentPermissions,
        loading,
        login,
        logout,
        switchUser: handleSwitchUser,
        pendingSwitchUser,
        openSwitchRoleModal,
        closeSwitchRoleModal,
        updateRolePermissions: handleUpdateRolePermissions,
        updateUserPassword: handleUpdateUserPassword,
        isGeneralManager,
        canManageRoles,
        canViewFinancials,
        canCollectPayment,
        canMarkAttendance,
        canManageStudents,
        canManageExpenses,
        canReversePayment,
        canConfigureSystem,
        canCloseDay,
        canViewReports,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
