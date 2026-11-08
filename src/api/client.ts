import {
  User,
  Student,
  SchoolClass,
  DashboardStats,
  DailyFeedingRow,
  WeeklyFeedingRow,
  Payment,
  FeedingExpense,
  DailyClosing,
  AuditLog,
  OutstandingReportRow,
  AttendanceRecord,
  RolePermissions,
} from '../types';

export const api = {
  // Auth
  async login(
    emailOrRole: string,
    password: string
  ): Promise<{
    success: boolean;
    user: User;
    permissions: RolePermissions;
    allRolePermissions: Record<string, RolePermissions>;
  }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrRole, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Login failed. Please check credentials.');
    }
    return res.json();
  },

  async logout(): Promise<{ success: boolean }> {
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    if (!res.ok) throw new Error('Logout failed');
    return res.json();
  },

  async getMe(): Promise<{
    user: User | null;
    availableUsers: User[];
    permissions?: RolePermissions;
    allRolePermissions?: Record<string, RolePermissions>;
  }> {
    const res = await fetch('/api/auth/me');
    if (!res.ok) throw new Error('Failed to fetch current user');
    return res.json();
  },

  async switchUser(userId: string, password: string): Promise<{
    success: boolean;
    user: User;
    permissions?: RolePermissions;
    allRolePermissions?: Record<string, RolePermissions>;
  }> {
    const res = await fetch('/api/auth/switch-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to switch role. Incorrect password.');
    }
    return res.json();
  },

  // Role Permissions
  async getRolePermissions(): Promise<Record<string, RolePermissions>> {
    const res = await fetch('/api/roles/permissions');
    if (!res.ok) throw new Error('Failed to fetch role permissions');
    return res.json();
  },

  async updateRolePermissions(
    role: string,
    permissions: Partial<RolePermissions>
  ): Promise<{ success: boolean; role: string; permissions: RolePermissions; allRolePermissions: Record<string, RolePermissions> }> {
    const res = await fetch('/api/roles/permissions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, permissions }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update permissions');
    }
    return res.json();
  },

  async getCredentialsSummary(): Promise<any[]> {
    const res = await fetch('/api/roles/credentials-summary');
    if (!res.ok) throw new Error('Failed to fetch credentials summary');
    return res.json();
  },

  async updateUserPassword(userId: string, newPassword: string): Promise<{ success: boolean; user: User }> {
    const res = await fetch(`/api/users/${userId}/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update password');
    }
    return res.json();
  },


  // Dashboard
  async getDashboardStats(date: string = '2026-10-09', range: string = 'Today'): Promise<DashboardStats> {
    const res = await fetch(`/api/dashboard/stats?date=${date}&range=${range}`);
    if (!res.ok) throw new Error('Failed to load dashboard metrics');
    return res.json();
  },

  // Students
  async getStudents(params?: { classId?: string; status?: string; search?: string }): Promise<Student[]> {
    const query = new URLSearchParams();
    if (params?.classId) query.set('classId', params.classId);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    const res = await fetch(`/api/students?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch students');
    return res.json();
  },

  async getStudentProfile(id: string): Promise<any> {
    const res = await fetch(`/api/students/${id}`);
    if (!res.ok) throw new Error('Failed to fetch student profile');
    return res.json();
  },

  async addStudent(data: Partial<Student>): Promise<Student> {
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to add student');
    }
    return res.json();
  },

  async updateStudent(id: string, data: Partial<Student>): Promise<Student> {
    const res = await fetch(`/api/students/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update student');
    }
    return res.json();
  },

  // Classes
  async getClasses(): Promise<SchoolClass[]> {
    const res = await fetch('/api/classes');
    if (!res.ok) throw new Error('Failed to fetch classes');
    return res.json();
  },

  async addClass(data: Partial<SchoolClass>): Promise<SchoolClass> {
    const res = await fetch('/api/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to add class');
    }
    return res.json();
  },

  // Attendance
  async getAttendance(date: string, classId?: string): Promise<AttendanceRecord[]> {
    const query = new URLSearchParams({ date });
    if (classId) query.set('classId', classId);
    const res = await fetch(`/api/attendance?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch attendance');
    return res.json();
  },

  async saveAttendanceRegister(date: string, classId: string, records: any[]): Promise<any> {
    const res = await fetch('/api/attendance/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, classId, records }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save attendance register');
    }
    return res.json();
  },

  // Feeding
  async getDailyFeeding(date: string, classId?: string): Promise<DailyFeedingRow[]> {
    const query = new URLSearchParams({ date });
    if (classId) query.set('classId', classId);
    const res = await fetch(`/api/feeding-fees/daily?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch daily feeding');
    return res.json();
  },

  async getWeeklyFeeding(weekRef: string, classId?: string): Promise<WeeklyFeedingRow[]> {
    const query = new URLSearchParams({ weekRef });
    if (classId) query.set('classId', classId);
    const res = await fetch(`/api/feeding-fees/weekly?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch weekly feeding');
    return res.json();
  },

  // Payments
  async getPayments(params?: { date?: string; studentId?: string; status?: string }): Promise<Payment[]> {
    const query = new URLSearchParams();
    if (params?.date) query.set('date', params.date);
    if (params?.studentId) query.set('studentId', params.studentId);
    if (params?.status) query.set('status', params.status);
    const res = await fetch(`/api/payments?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch payments');
    return res.json();
  },

  async recordPayment(payload: any): Promise<any> {
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to record payment');
    }
    return res.json();
  },

  async reversePayment(paymentId: string, reason: string): Promise<any> {
    const res = await fetch(`/api/payments/${paymentId}/reverse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to reverse payment');
    }
    return res.json();
  },

  // Feeding Expenses
  async getFeedingExpenses(startDate?: string, endDate?: string): Promise<FeedingExpense[]> {
    const query = new URLSearchParams();
    if (startDate) query.set('startDate', startDate);
    if (endDate) query.set('endDate', endDate);
    const res = await fetch(`/api/feeding-expenses?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch expenses');
    return res.json();
  },

  async addFeedingExpense(data: Partial<FeedingExpense>): Promise<FeedingExpense> {
    const res = await fetch('/api/feeding-expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to add feeding expense');
    }
    return res.json();
  },

  // Daily Closing
  async getDailyClosings(): Promise<DailyClosing[]> {
    const res = await fetch('/api/daily-closings');
    if (!res.ok) throw new Error('Failed to fetch daily closings');
    return res.json();
  },

  async closeDay(date: string, notes?: string): Promise<any> {
    const res = await fetch('/api/daily-closings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, notes }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to close day');
    }
    return res.json();
  },

  // Reports
  async getOutstandingReport(classId?: string): Promise<OutstandingReportRow[]> {
    const query = new URLSearchParams();
    if (classId) query.set('classId', classId);
    const res = await fetch(`/api/reports/outstanding?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch outstanding report');
    return res.json();
  },

  // Audit
  async getAuditLogs(): Promise<AuditLog[]> {
    const res = await fetch('/api/audit-logs');
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  // Google Sheets
  async getGoogleSheetsStatus(): Promise<any> {
    const res = await fetch('/api/google-sheets/status');
    if (!res.ok) throw new Error('Failed to fetch sheets status');
    return res.json();
  },

  async configureGoogleSheets(data: any): Promise<any> {
    const res = await fetch('/api/google-sheets/configure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update config');
    return res.json();
  },

  async testGoogleSheetsConnection(): Promise<any> {
    const res = await fetch('/api/google-sheets/test-connection', {
      method: 'POST',
    });
    return res.json();
  },

  async runControlledTest(): Promise<any> {
    const res = await fetch('/api/google-sheets/controlled-test', {
      method: 'POST',
    });
    return res.json();
  },

  async initGoogleSheets(): Promise<any> {
    const res = await fetch('/api/google-sheets/init-sheets', {
      method: 'POST',
    });
    return res.json();
  },

  async syncAllToGoogleSheets(): Promise<any> {
    const res = await fetch('/api/google-sheets/sync-all', {
      method: 'POST',
    });
    return res.json();
  },
};
