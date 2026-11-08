import express, { Request, Response } from 'express';
import { db } from './db';
import { googleSheetsService } from './googleSheets';
import { User } from './types';

export const router = express.Router();

// Active session user (defaults to Mr. Michael Addo - General Manager)
let currentSessionUser: User | null = db.getUsers().find((u) => u.roleName === 'General Manager') || db.getUsers()[0];

function getActiveUser(): User {
  return currentSessionUser || db.getUsers().find((u) => u.roleName === 'General Manager') || db.getUsers()[0];
}

// --- AUTH & USER ROUTES ---
router.post('/auth/login', (req: Request, res: Response) => {
  const { emailOrRole, password } = req.body;
  if (!emailOrRole || !password) {
    return res.status(400).json({ error: 'Please enter your username, email, or role, and your password.' });
  }

  const result = db.authenticate(emailOrRole, password);
  if (!result.success || !result.user) {
    return res.status(401).json({ error: result.error || 'Authentication failed' });
  }

  currentSessionUser = result.user;
  db.addAuditLog({
    userId: result.user.id,
    userName: result.user.name,
    userRole: result.user.roleName,
    action: 'USER_LOGIN',
    entity: 'User',
    entityId: result.user.id,
    details: `${result.user.name} logged into system as ${result.user.roleName}`,
  });

  res.json({
    success: true,
    user: currentSessionUser,
    permissions: db.getRolePermissions(result.user.roleName),
    allRolePermissions: db.getAllRolePermissions(),
  });
});

router.post('/auth/logout', (req: Request, res: Response) => {
  if (currentSessionUser) {
    db.addAuditLog({
      userId: currentSessionUser.id,
      userName: currentSessionUser.name,
      userRole: currentSessionUser.roleName,
      action: 'USER_LOGOUT',
      entity: 'User',
      entityId: currentSessionUser.id,
      details: `${currentSessionUser.name} logged out of session`,
    });
  }
  currentSessionUser = null;
  res.json({ success: true, message: 'Logged out successfully' });
});

router.get('/auth/me', (req: Request, res: Response) => {
  res.json({
    user: currentSessionUser,
    availableUsers: db.getUsers(),
    permissions: currentSessionUser ? db.getRolePermissions(currentSessionUser.roleName) : null,
    allRolePermissions: db.getAllRolePermissions(),
  });
});

router.post('/auth/switch-user', (req: Request, res: Response) => {
  const { userId, password } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  const user = db.getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Password verification is strictly required to switch roles
  if (!password || typeof password !== 'string' || password.trim() === '') {
    return res.status(401).json({ error: `Please enter the password for ${user.name} (${user.roleName}) to authorize role switch.` });
  }

  if (user.password && user.password !== password.trim()) {
    db.addAuditLog({
      userId: currentSessionUser?.id || 'USR-ANON',
      userName: currentSessionUser?.name || 'Anonymous',
      userRole: currentSessionUser?.roleName || 'Unknown',
      action: 'FAILED_ROLE_SWITCH',
      entity: 'User',
      entityId: user.id,
      details: `Denied attempt to switch to ${user.name} (${user.roleName}) - incorrect password entered`,
    });
    return res.status(401).json({ error: `Incorrect password for ${user.roleName}. Role switch denied.` });
  }

  currentSessionUser = user;
  user.lastLogin = new Date().toISOString();
  db.addAuditLog({
    userId: user.id,
    userName: user.name,
    userRole: user.roleName,
    action: 'SWITCH_USER_SESSION',
    entity: 'User',
    entityId: user.id,
    details: `Session successfully switched to ${user.name} (${user.roleName}) with verified password`,
  });

  res.json({
    success: true,
    user: currentSessionUser,
    permissions: db.getRolePermissions(user.roleName),
    allRolePermissions: db.getAllRolePermissions(),
  });
});

// --- ROLE PERMISSIONS & CREDENTIALS MANAGEMENT ---
router.get('/roles/permissions', (req: Request, res: Response) => {
  res.json(db.getAllRolePermissions());
});

router.put('/roles/permissions', (req: Request, res: Response) => {
  const { role, permissions } = req.body;
  if (!role || !permissions) {
    return res.status(400).json({ error: 'Role and permissions payload are required' });
  }

  const updated = db.updateRolePermissions(role, permissions);
  db.addAuditLog({
    userId: currentSessionUser?.id || 'USR-001',
    userName: currentSessionUser?.name || 'General Manager',
    userRole: currentSessionUser?.roleName || 'General Manager',
    action: 'UPDATE_ROLE_PERMISSIONS',
    entity: 'RolePermissions',
    entityId: role,
    details: `Updated permissions for ${role}: ${Object.entries(permissions).map(([k, v]) => `${k}=${v}`).join(', ')}`,
  });

  res.json({
    success: true,
    role,
    permissions: updated,
    allRolePermissions: db.getAllRolePermissions(),
  });
});

router.get('/roles/credentials-summary', (req: Request, res: Response) => {
  const users = db.getUsers().map((u) => ({
    id: u.id,
    name: u.name,
    roleName: u.roleName,
    email: u.email,
    username: u.username || u.roleName.toLowerCase().replace(/\s+/g, '-'),
    password: u.password || 'Melstar@2026',
    phone: u.phone,
    lastLogin: u.lastLogin,
  }));
  res.json(users);
});

router.put('/users/:id/password', (req: Request, res: Response) => {
  const { newPassword } = req.body;
  if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters long' });
  }

  const updatedUser = db.updateUserPassword(req.params.id, newPassword);
  if (!updatedUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  db.addAuditLog({
    userId: currentSessionUser?.id || 'USR-001',
    userName: currentSessionUser?.name || 'General Manager',
    userRole: currentSessionUser?.roleName || 'General Manager',
    action: 'CHANGE_USER_PASSWORD',
    entity: 'User',
    entityId: updatedUser.id,
    details: `Updated password for staff user ${updatedUser.name} (${updatedUser.roleName})`,
  });

  res.json({ success: true, user: updatedUser });
});


// --- DASHBOARD ROUTES ---
router.get('/dashboard/stats', (req: Request, res: Response) => {
  const date = (req.query.date as string) || '2026-10-09';
  const range = (req.query.range as string) || 'Today';
  const stats = db.getDashboardStats(date, range);
  res.json(stats);
});

// --- STUDENTS ROUTES ---
router.get('/students', (req: Request, res: Response) => {
  const classId = req.query.classId as string;
  const status = req.query.status as string;
  const search = req.query.search as string;
  const students = db.getStudents({ classId, status, search });
  res.json(students);
});

router.get('/students/:id', (req: Request, res: Response) => {
  const profile = db.getStudentById(req.params.id);
  if (!profile) {
    return res.status(404).json({ error: 'Student not found' });
  }
  res.json(profile);
});

router.post('/students', (req: Request, res: Response) => {
  try {
    const student = db.addStudent(req.body, getActiveUser());
    res.status(201).json(student);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/students/:id', (req: Request, res: Response) => {
  try {
    const updated = db.updateStudent(req.params.id, req.body, getActiveUser());
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- CLASSES ROUTES ---
router.get('/classes', (req: Request, res: Response) => {
  res.json(db.getClasses());
});

router.post('/classes', (req: Request, res: Response) => {
  try {
    const newClass = db.addClass(req.body, getActiveUser());
    res.status(201).json(newClass);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/classes/:id', (req: Request, res: Response) => {
  try {
    const updated = db.updateClass(req.params.id, req.body, getActiveUser());
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- ATTENDANCE ROUTES ---
router.get('/attendance', (req: Request, res: Response) => {
  const date = (req.query.date as string) || '2026-10-09';
  const classId = req.query.classId as string;
  const records = db.getAttendance(date, classId);
  res.json(records);
});

router.post('/attendance/register', (req: Request, res: Response) => {
  try {
    const { date, classId, records } = req.body;
    if (!date || !classId || !records) {
      return res.status(400).json({ error: 'Date, classId, and records array are required' });
    }
    const updated = db.saveAttendanceRegister(date, classId, records, getActiveUser());
    res.json({ success: true, records: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- FEEDING FEES ROUTES ---
router.get('/feeding-fees/daily', (req: Request, res: Response) => {
  const date = (req.query.date as string) || '2026-10-09';
  const classId = req.query.classId as string;
  const register = db.getDailyFeedingRegister(date, classId);
  res.json(register);
});

router.get('/feeding-fees/weekly', (req: Request, res: Response) => {
  const weekRef = (req.query.weekRef as string) || '2026-W41';
  const classId = req.query.classId as string;
  const register = db.getWeeklyFeedingRegister(weekRef, classId);
  res.json(register);
});

// --- PAYMENTS & RECEIPTS ROUTES ---
router.get('/payments', (req: Request, res: Response) => {
  const date = req.query.date as string;
  const studentId = req.query.studentId as string;
  const status = req.query.status as string;
  const payments = db.getPayments({ date, studentId, status });
  res.json(payments);
});

router.post('/payments', (req: Request, res: Response) => {
  try {
    const result = db.recordPayment({
      ...req.body,
      collector: getActiveUser(),
    });
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/payments/:id/reverse', (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ error: 'Reversal reason is required' });
    }
    const reversal = db.reversePayment(req.params.id, reason, getActiveUser());
    res.json({ success: true, reversal });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- FEEDING EXPENSES ROUTES ---
router.get('/feeding-expenses', (req: Request, res: Response) => {
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;
  res.json(db.getFeedingExpenses(startDate, endDate));
});

router.post('/feeding-expenses', (req: Request, res: Response) => {
  try {
    const expense = db.addFeedingExpense(req.body, getActiveUser());
    res.status(201).json(expense);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- DAILY CLOSINGS ---
router.get('/daily-closings', (req: Request, res: Response) => {
  res.json(db.getDailyClosings());
});

router.post('/daily-closings', (req: Request, res: Response) => {
  try {
    const { date, notes } = req.body;
    const closing = db.closeDay(date || '2026-10-09', getActiveUser(), notes);
    res.json({ success: true, closing });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- OUTSTANDING FEES REPORT ---
router.get('/reports/outstanding', (req: Request, res: Response) => {
  const classId = req.query.classId as string;
  const report = db.getOutstandingFeesReport(classId);
  res.json(report);
});

// --- AUDIT LOGS ---
router.get('/audit-logs', (req: Request, res: Response) => {
  const logs = db.getAuditLogs(100);
  res.json(logs);
});

// --- GOOGLE SHEETS INTEGRATION ROUTES ---
router.get('/google-sheets/status', (req: Request, res: Response) => {
  const status = googleSheetsService.getStatus();
  res.json(status);
});

router.post('/google-sheets/configure', (req: Request, res: Response) => {
  const { spreadsheetId, serviceAccountEmail, privateKey } = req.body;
  googleSheetsService.reloadConfig({
    spreadsheetId,
    email: serviceAccountEmail,
    privateKey,
  });
  res.json({ success: true, message: 'Google Sheets configuration updated in memory' });
});

router.post('/google-sheets/test-connection', async (req: Request, res: Response) => {
  try {
    const result = await googleSheetsService.testConnection();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/google-sheets/controlled-test', async (req: Request, res: Response) => {
  try {
    const result = await googleSheetsService.performControlledTest();
    const active = getActiveUser();
    db.addAuditLog({
      userId: active.id,
      userName: active.name,
      userRole: active.roleName,
      action: 'CONTROLLED_SHEETS_TEST',
      entity: 'GoogleSheets',
      entityId: result.testId,
      details: `Controlled test write & read-back succeeded in ${result.durationMs}ms`,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/google-sheets/init-sheets', async (req: Request, res: Response) => {
  try {
    const result = await googleSheetsService.initializeSheets();
    const active = getActiveUser();
    db.addAuditLog({
      userId: active.id,
      userName: active.name,
      userRole: active.roleName,
      action: 'INIT_GOOGLE_SHEETS',
      entity: 'GoogleSheets',
      entityId: 'Master',
      details: `Initialized ${result.createdSheets.length} worksheets with column schemas in Google Sheets`,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/google-sheets/sync-all', async (req: Request, res: Response) => {
  try {
    const allData = db.getAllSheetsData();
    const result = await googleSheetsService.syncDataToSheets(allData);
    const active = getActiveUser();
    db.addAuditLog({
      userId: active.id,
      userName: active.name,
      userRole: active.roleName,
      action: 'SYNC_GOOGLE_SHEETS',
      entity: 'GoogleSheets',
      entityId: 'All',
      details: 'Full synchronization of all ERP entities to Google Sheets completed',
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- BACKUP DOWNLOAD ---
router.get('/backup/export', (req: Request, res: Response) => {
  const allData = db.getAllSheetsData();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=melstar_erp_backup.json');
  res.send(JSON.stringify(allData, null, 2));
});
