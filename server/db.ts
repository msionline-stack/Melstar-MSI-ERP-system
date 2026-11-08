import fs from 'fs';
import path from 'path';
import {
  User,
  Student,
  SchoolClass,
  AcademicYear,
  AcademicTerm,
  CalendarEvent,
  FeeCategory,
  FeeObligation,
  AttendanceRecord,
  Payment,
  PaymentAllocation,
  PaymentReversal,
  FeedingExpense,
  DailyClosing,
  AuditLog,
  TransactionJournalEntry,
  RoleType,
  RolePermissions,
} from './types';
import {
  initialUsers,
  initialAcademicYears,
  initialAcademicTerms,
  initialClasses,
  initialFeeCategories,
  initialStudents,
  initialAttendance,
  initialObligations,
  initialPayments,
  initialFeedingExpenses,
  initialDailyClosings,
  initialAuditLogs,
  initialCalendarEvents,
} from './data/seedData';
import { googleSheetsService } from './googleSheets';

interface DbState {
  users: User[];
  rolePermissions?: Record<string, RolePermissions>;
  academicYears: AcademicYear[];
  academicTerms: AcademicTerm[];
  classes: SchoolClass[];
  feeCategories: FeeCategory[];
  students: Student[];
  attendance: AttendanceRecord[];
  obligations: FeeObligation[];
  payments: Payment[];
  paymentAllocations: PaymentAllocation[];
  paymentReversals: PaymentReversal[];
  feedingExpenses: FeedingExpense[];
  dailyClosings: DailyClosing[];
  auditLogs: AuditLog[];
  transactionJournal: TransactionJournalEntry[];
  calendarEvents: CalendarEvent[];
  settings: Record<string, string>;
  activeGoogleSync: boolean;
}

const defaultRolePermissions: Record<string, RolePermissions> = {
  'General Manager': {
    role: 'General Manager',
    description: 'Master executive authority with full access to all roles and ability to manage what other roles can do',
    canViewFinancials: true,
    canCollectPayment: true,
    canMarkAttendance: true,
    canManageStudents: true,
    canManageExpenses: true,
    canReversePayment: true,
    canConfigureSystem: true,
    canCloseDay: true,
    canViewReports: true,
  },
  'Director': {
    role: 'Director',
    description: 'Overall school governance, strategic oversight, financial audits, institutional authority',
    canViewFinancials: true,
    canCollectPayment: true,
    canMarkAttendance: true,
    canManageStudents: true,
    canManageExpenses: true,
    canReversePayment: true,
    canConfigureSystem: true,
    canCloseDay: true,
    canViewReports: true,
  },
  'Proprietress': {
    role: 'Proprietress',
    description: 'Executive institutional leadership, school welfare, full administrative authority',
    canViewFinancials: true,
    canCollectPayment: true,
    canMarkAttendance: true,
    canManageStudents: true,
    canManageExpenses: true,
    canReversePayment: true,
    canConfigureSystem: true,
    canCloseDay: true,
    canViewReports: true,
  },
  'Administrator': {
    role: 'Administrator',
    description: 'Student enrollment, class management, attendance register oversight, daily operations & closing',
    canViewFinancials: true,
    canCollectPayment: true,
    canMarkAttendance: true,
    canManageStudents: true,
    canManageExpenses: false,
    canReversePayment: false,
    canConfigureSystem: true,
    canCloseDay: true,
    canViewReports: true,
  },
  'Accountant': {
    role: 'Accountant',
    description: 'Payment reconciliation, kitchen food procurement expenses, bank verification, reversals',
    canViewFinancials: true,
    canCollectPayment: false,
    canMarkAttendance: true,
    canManageStudents: false,
    canManageExpenses: true,
    canReversePayment: true,
    canConfigureSystem: false,
    canCloseDay: false,
    canViewReports: true,
  },
  'Cashier or Fee Collector': {
    role: 'Cashier or Fee Collector',
    description: 'Collect daily feeding & tuition fees, print receipts, count cash till. No silent deletes',
    canViewFinancials: true,
    canCollectPayment: true,
    canMarkAttendance: true,
    canManageStudents: false,
    canManageExpenses: false,
    canReversePayment: false,
    canConfigureSystem: false,
    canCloseDay: false,
    canViewReports: false,
  },
};

const DB_FILE_PATH = path.resolve(process.cwd(), 'server', 'data', 'melstar_db.json');

class Database {
  private state: DbState;

  constructor() {
    this.state = this.loadOrInit();
  }

  private loadOrInit(): DbState {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn('Failed to load DB file, reinitializing with seed data:', err);
    }

    const flatAllocations: PaymentAllocation[] = [];
    initialPayments.forEach((p) => {
      if (p.allocations) {
        flatAllocations.push(...p.allocations);
      }
    });

    const defaultState: DbState = {
      users: initialUsers,
      academicYears: initialAcademicYears,
      academicTerms: initialAcademicTerms,
      classes: initialClasses,
      feeCategories: initialFeeCategories,
      students: initialStudents,
      attendance: initialAttendance,
      obligations: initialObligations,
      payments: initialPayments,
      paymentAllocations: flatAllocations,
      paymentReversals: [],
      feedingExpenses: initialFeedingExpenses,
      dailyClosings: initialDailyClosings,
      auditLogs: initialAuditLogs,
      transactionJournal: [],
      calendarEvents: initialCalendarEvents,
      settings: {
        schoolName: 'Melstar Children Training Centre',
        schoolLocation: 'New Gbawe, Greater Accra, Ghana',
        schoolMotto: 'Solid Foundation, Bright Future',
        currency: 'GHS',
        currencySymbol: 'GH₵',
        dailyFeedingDefault: '10',
        weeklyFeedingDefault: '50',
        currentTerm: 'Term 1',
        currentAcademicYear: '2026/2027',
      },
      activeGoogleSync: false,
    };

    this.persist(defaultState);
    return defaultState;
  }

  private persist(stateToSave?: DbState) {
    const s = stateToSave || this.state;
    try {
      const dir = path.dirname(DB_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(s, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error persisting database to disk:', err);
    }
  }

  // Idempotency journal
  public logJournal(key: string, type: string, amount: number, refId: string, status: 'Success' | 'Failed', payload: any) {
    const entry: TransactionJournalEntry = {
      id: `TXJ-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      idempotencyKey: key,
      timestamp: new Date().toISOString(),
      type,
      amount,
      referenceId: refId,
      status,
      payloadJson: JSON.stringify(payload),
    };
    this.state.transactionJournal.unshift(entry);
    this.persist();
    return entry;
  }

  public checkIdempotency(key?: string): TransactionJournalEntry | undefined {
    if (!key) return undefined;
    return this.state.transactionJournal.find((j) => j.idempotencyKey === key && j.status === 'Success');
  }

  // Audit Log
  public addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>) {
    const entry: AuditLog = {
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      ...log,
    };
    this.state.auditLogs.unshift(entry);
    this.persist();
    return entry;
  }

  public getAuditLogs(limit = 100) {
    return this.state.auditLogs.slice(0, limit);
  }

  // Users & Authentication
  public getUsers() {
    return this.state.users;
  }

  public getUserById(id: string) {
    return this.state.users.find((u) => u.id === id);
  }

  public getUserByCredential(emailOrRoleOrUsername: string) {
    const q = emailOrRoleOrUsername.trim().toLowerCase();
    return this.state.users.find(
      (u) =>
        u.email.toLowerCase() === q ||
        u.name.toLowerCase() === q ||
        u.roleName.toLowerCase() === q ||
        (u.username && u.username.toLowerCase() === q) ||
        u.id.toLowerCase() === q
    );
  }

  public authenticate(emailOrRoleOrUsername: string, passwordAttempt: string) {
    const user = this.getUserByCredential(emailOrRoleOrUsername);
    if (!user) {
      return { success: false, error: 'User not found. Please check your email, username, or role selection.' };
    }
    if (user.password && user.password !== passwordAttempt.trim()) {
      return { success: false, error: 'Incorrect password entered.' };
    }
    user.lastLogin = new Date().toISOString();
    this.persist();
    return { success: true, user };
  }

  public updateUserPassword(userId: string, newPassword: string) {
    const user = this.getUserById(userId);
    if (!user) return null;
    user.password = newPassword.trim();
    this.persist();
    return user;
  }

  // Role Permissions
  public getRolePermissions(roleName?: string): RolePermissions | undefined {
    if (!roleName) return undefined;
    const all = this.getAllRolePermissions();
    return all[roleName];
  }

  public getAllRolePermissions(): Record<string, RolePermissions> {
    if (!this.state.rolePermissions || Object.keys(this.state.rolePermissions).length === 0) {
      this.state.rolePermissions = { ...defaultRolePermissions };
      this.persist();
    }
    return this.state.rolePermissions || defaultRolePermissions;
  }

  public updateRolePermissions(role: RoleType, permissions: Partial<RolePermissions>) {
    const all = this.getAllRolePermissions();
    if (!all[role]) {
      all[role] = {
        role,
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
    }
    all[role] = {
      ...all[role],
      ...permissions,
      role,
    };
    this.state.rolePermissions = all;
    this.persist();
    return all[role];
  }


  // Classes
  public getClasses() {
    // dynamically compute enrolled count
    return this.state.classes.map((cls) => {
      const count = this.state.students.filter((s) => s.classId === cls.id && s.status === 'Active').length;
      return {
        ...cls,
        enrolledCount: count,
      };
    });
  }

  public addClass(cls: Omit<SchoolClass, 'id'>, user: User) {
    const newClass: SchoolClass = {
      id: `CLS-${Date.now().toString(36).toUpperCase()}`,
      ...cls,
    };
    this.state.classes.push(newClass);
    this.addAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: user.roleName,
      action: 'CREATE_CLASS',
      entity: 'SchoolClass',
      entityId: newClass.id,
      details: `Created new class: ${newClass.name} with default fee GH₵ ${newClass.defaultClassFee}`,
    });
    this.persist();
    return newClass;
  }

  public updateClass(id: string, updates: Partial<SchoolClass>, user: User) {
    const idx = this.state.classes.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Class not found');
    this.state.classes[idx] = { ...this.state.classes[idx], ...updates };
    this.addAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: user.roleName,
      action: 'UPDATE_CLASS',
      entity: 'SchoolClass',
      entityId: id,
      details: `Updated class details: ${JSON.stringify(updates)}`,
    });
    this.persist();
    return this.state.classes[idx];
  }

  // Students
  public getStudents(filter?: { classId?: string; status?: string; search?: string }) {
    let list = [...this.state.students];
    if (filter?.classId && filter.classId !== 'all') {
      list = list.filter((s) => s.classId === filter.classId);
    }
    if (filter?.status && filter.status !== 'all') {
      list = list.filter((s) => s.status === filter.status);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.fullName.toLowerCase().includes(q) ||
          s.admissionNumber.toLowerCase().includes(q) ||
          s.parentName.toLowerCase().includes(q) ||
          s.parentPhone.includes(q)
      );
    }
    return list;
  }

  public getStudentById(id: string) {
    const student = this.state.students.find((s) => s.id === id);
    if (!student) return null;

    // Full profile aggregation
    const attendanceHistory = this.state.attendance
      .filter((a) => a.studentId === id)
      .sort((a, b) => b.date.localeCompare(a.date));

    const obligations = this.state.obligations
      .filter((o) => o.studentId === id)
      .sort((a, b) => b.dueDate.localeCompare(a.dueDate));

    const payments = this.state.payments
      .filter((p) => p.studentId === id && p.status === 'Completed')
      .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));

    const totalAttendanceCount = attendanceHistory.length;
    const presentCount = attendanceHistory.filter((a) => a.status === 'Present' || a.status === 'Late').length;
    const attendancePercentage = totalAttendanceCount > 0 ? (presentCount / totalAttendanceCount) * 100 : 100;

    const totalObligationsDue = obligations.reduce((sum, o) => sum + o.amountDue, 0) + student.openingBalance;
    const totalPaid = payments.reduce((sum, p) => sum + p.totalAmount, 0);
    const totalOutstanding = Math.max(0, totalObligationsDue - totalPaid);

    return {
      student,
      attendanceHistory,
      obligations,
      payments,
      attendancePercentage: Math.round(attendancePercentage * 10) / 10,
      totalOutstanding,
      totalPaid,
    };
  }

  public addStudent(studentData: Omit<Student, 'id' | 'createdAt'>, user: User) {
    // 1. Prevent duplicate student admission numbers or exact full name in same class
    const cleanAdmission = (studentData.admissionNumber || '').trim().toUpperCase();
    const cleanName = (studentData.fullName || '').trim().toLowerCase();

    if (cleanAdmission) {
      const existingByAdm = this.state.students.find(
        (s) => s.admissionNumber.trim().toUpperCase() === cleanAdmission
      );
      if (existingByAdm) {
        throw new Error(`A student with Admission Number "${studentData.admissionNumber}" already exists (${existingByAdm.fullName} in ${existingByAdm.className}).`);
      }
    }

    const existingByNameAndClass = this.state.students.find(
      (s) => s.fullName.trim().toLowerCase() === cleanName && s.classId === studentData.classId
    );
    if (existingByNameAndClass) {
      throw new Error(`A student named "${studentData.fullName}" is already enrolled in ${studentData.className || 'this class'}.`);
    }

    const id = `STU-${Date.now().toString(36).toUpperCase()}`;
    const newStudent: Student = {
      id,
      ...studentData,
      admissionNumber: cleanAdmission || `STU-${String(this.state.students.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
    };
    this.state.students.push(newStudent);

    // Auto-generate term obligations if active class
    const cls = this.state.classes.find((c) => c.id === newStudent.classId);
    if (cls) {
      const tuitionObligation: FeeObligation = {
        id: `OBL-TUI-${id}-${Date.now()}`,
        studentId: id,
        feeCategoryId: 'FC-TUITION',
        feeCategoryName: 'Class Fee / Tuition',
        periodType: 'Termly',
        periodRef: '2026-Term-1',
        dueDate: '2026-10-31',
        amountDue: newStudent.customClassFee || cls.defaultClassFee || 380,
        amountPaid: 0,
        balance: newStudent.customClassFee || cls.defaultClassFee || 380,
        status: 'Unpaid',
        academicYear: '2026/2027',
        term: 'Term 1',
        createdAt: new Date().toISOString(),
      };
      this.state.obligations.push(tuitionObligation);
    }

    this.addAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: user.roleName,
      action: 'REGISTER_STUDENT',
      entity: 'Student',
      entityId: id,
      details: `Registered new student: ${newStudent.fullName} (${newStudent.admissionNumber}) in ${newStudent.className}`,
    });
    this.persist();

    // Asynchronously push to Google Sheets (non-blocking)
    googleSheetsService.appendRecord('Students', newStudent).catch((err) => {
      console.error('[GoogleSheets] Asynchronous student append warning:', err.message);
    });

    return newStudent;
  }

  public updateStudent(id: string, updates: Partial<Student>, user: User) {
    const idx = this.state.students.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Student not found');
    this.state.students[idx] = { ...this.state.students[idx], ...updates };
    this.addAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: user.roleName,
      action: 'UPDATE_STUDENT',
      entity: 'Student',
      entityId: id,
      details: `Updated student details for ${this.state.students[idx].fullName}`,
    });
    this.persist();
    return this.state.students[idx];
  }

  // Attendance
  public getAttendance(date: string, classId?: string) {
    let list = this.state.attendance.filter((a) => a.date === date);
    if (classId && classId !== 'all') {
      list = list.filter((a) => a.classId === classId);
    }
    return list;
  }

  public saveAttendanceRegister(
    date: string,
    classId: string,
    records: Array<{
      studentId: string;
      studentName: string;
      status: AttendanceRecord['status'];
      arrivalTime?: string;
      notes?: string;
    }>,
    user: User
  ) {
    const cls = this.state.classes.find((c) => c.id === classId);
    const className = cls ? cls.name : 'Unknown';

    records.forEach((rec) => {
      const existingIdx = this.state.attendance.findIndex(
        (a) => a.date === date && a.studentId === rec.studentId
      );

      const recordItem: AttendanceRecord = {
        id: existingIdx >= 0 ? this.state.attendance[existingIdx].id : `ATT-${date.replace(/-/g, '')}-${rec.studentId}`,
        studentId: rec.studentId,
        studentName: rec.studentName,
        classId,
        className,
        date,
        status: rec.status,
        arrivalTime: rec.arrivalTime || (rec.status === 'Present' ? '07:45' : undefined),
        recordedBy: user.id,
        recordedByName: user.name,
        recordedAt: new Date().toISOString(),
        notes: rec.notes,
      };

      if (existingIdx >= 0) {
        this.state.attendance[existingIdx] = recordItem;
      } else {
        this.state.attendance.push(recordItem);
      }

      // Check if student is present and daily feeding obligation exists; if not create it
      const student = this.state.students.find((s) => s.id === rec.studentId);
      if (student && student.feedingArrangement === 'Daily' && (rec.status === 'Present' || rec.status === 'Late')) {
        const hasObligation = this.state.obligations.some(
          (o) => o.studentId === rec.studentId && o.feeCategoryId === 'FC-FEED' && o.periodRef === date
        );
        if (!hasObligation) {
          const feeAmount = student.customFeedingFee ?? cls?.defaultFeedingFee ?? 8;
          this.state.obligations.push({
            id: `OBL-FEED-${date}-${rec.studentId}`,
            studentId: rec.studentId,
            feeCategoryId: 'FC-FEED',
            feeCategoryName: 'Feeding Fee',
            periodType: 'Daily',
            periodRef: date,
            dueDate: date,
            amountDue: feeAmount,
            amountPaid: 0,
            balance: feeAmount,
            status: 'Unpaid',
            academicYear: '2026/2027',
            term: 'Term 1',
            createdAt: new Date().toISOString(),
          });
        }
      }
    });

    this.addAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: user.roleName,
      action: 'MARK_ATTENDANCE',
      entity: 'Attendance',
      entityId: classId,
      details: `Saved attendance register for ${className} on ${date} (${records.length} students)`,
    });

    this.persist();
    return this.getAttendance(date, classId);
  }

  // Feeding Fees Daily & Weekly
  public getDailyFeedingRegister(date: string, classId?: string) {
    const students = this.getStudents({ classId, status: 'Active' });
    const attendance = this.getAttendance(date, classId);
    const dayPayments = this.state.payments.filter((p) => p.paymentDate === date && p.status === 'Completed');

    return students.map((stu) => {
      const att = attendance.find((a) => a.studentId === stu.id);
      const attStatus = att ? att.status : 'Not Marked';

      // Daily feeding obligation for this day
      const obligation = this.state.obligations.find(
        (o) => o.studentId === stu.id && o.feeCategoryId === 'FC-FEED' && o.periodRef === date
      );

      // Check if student already paid feeding fee for this day
      const allocation = this.state.paymentAllocations.find(
        (a) => a.studentId === stu.id && a.feeCategoryId === 'FC-FEED' && a.periodRef === date
      );

      // Or payment today for feeding
      let amountPaid = allocation ? allocation.amountAllocated : obligation ? obligation.amountPaid : 0;
      const stuClass = this.state.classes.find((c) => c.id === stu.classId);
      let feeDue = stu.customFeedingFee !== undefined ? stu.customFeedingFee : (stuClass?.defaultFeedingFee ?? 8);
      if (stu.feedingArrangement === 'Exempt') {
        feeDue = 0;
      }

      let status: 'Paid' | 'Partially Paid' | 'Unpaid' | 'Exempt' | 'Weekly Covered' = 'Unpaid';
      if (stu.feedingArrangement === 'Exempt') {
        status = 'Exempt';
      } else if (stu.feedingArrangement === 'Weekly') {
        status = 'Weekly Covered';
      } else if (amountPaid >= feeDue) {
        status = 'Paid';
      } else if (amountPaid > 0) {
        status = 'Partially Paid';
      }

      const paymentRecord = dayPayments.find((p) => p.studentId === stu.id);

      return {
        studentId: stu.id,
        admissionNumber: stu.admissionNumber,
        fullName: stu.fullName,
        className: stu.className,
        classId: stu.classId,
        parentPhone: stu.parentPhone,
        feedingArrangement: stu.feedingArrangement,
        attendanceStatus: attStatus,
        feeDue,
        amountPaid,
        outstanding: Math.max(0, feeDue - amountPaid),
        paymentStatus: status,
        collectorName: paymentRecord?.collectorName || '-',
        receiptNumber: paymentRecord?.receiptNumber || '-',
        paymentMethod: paymentRecord?.paymentMethod || '-',
      };
    });
  }

  public getWeeklyFeedingRegister(weekRef: string = '2026-W41', classId?: string) {
    const students = this.getStudents({ classId, status: 'Active' });

    return students.map((stu) => {
      // Find weekly obligation or compute scheduled days * daily feeding fee
      const weeklyObligation = this.state.obligations.find(
        (o) => o.studentId === stu.id && o.feeCategoryId === 'FC-FEED' && o.periodRef === weekRef
      );

      const stuClass = this.state.classes.find((c) => c.id === stu.classId);
      const dailyRate = stu.customFeedingFee !== undefined ? stu.customFeedingFee : (stuClass?.defaultFeedingFee ?? 8);
      const scheduledDays = 5;
      const expectedWeekly = stu.feedingArrangement === 'Exempt' ? 0 : scheduledDays * dailyRate;
      const paid = weeklyObligation ? weeklyObligation.amountPaid : 0;
      const outstanding = Math.max(0, expectedWeekly - paid);

      return {
        studentId: stu.id,
        admissionNumber: stu.admissionNumber,
        fullName: stu.fullName,
        className: stu.className,
        classId: stu.classId,
        parentPhone: stu.parentPhone,
        feedingArrangement: stu.feedingArrangement,
        scheduledDays,
        daysPresent: 4,
        daysAbsent: 1,
        expectedWeeklyFee: expectedWeekly,
        totalPaidWeekly: paid,
        outstandingBalance: outstanding,
        paymentStatus: paid >= expectedWeekly ? 'Paid' : paid > 0 ? 'Partially Paid' : 'Unpaid',
      };
    });
  }

  // Payment Collection & Receipts
  public recordPayment(params: {
    studentId: string;
    totalAmount: number;
    paymentDate: string;
    paymentMethod: Payment['paymentMethod'];
    transactionRef?: string;
    notes?: string;
    collector: User;
    allocations: Array<{
      feeCategoryId: string;
      feeCategoryName: string;
      obligationId?: string;
      amountAllocated: number;
      periodRef?: string;
    }>;
    idempotencyKey?: string;
  }) {
    if (!params.totalAmount || params.totalAmount <= 0) {
      throw new Error('Payment collection amount must be a positive number greater than 0.');
    }

    if (params.idempotencyKey) {
      const existing = this.checkIdempotency(params.idempotencyKey);
      if (existing) {
        return JSON.parse(existing.payloadJson);
      }
    }

    // Prevent duplicate payment transaction references (e.g. mobile money txn or bank ref)
    if (params.transactionRef && params.transactionRef.trim() && params.transactionRef !== 'N/A') {
      const cleanRef = params.transactionRef.trim().toUpperCase();
      const duplicateTxn = this.state.payments.find(
        (p) => p.status === 'Completed' && p.transactionRef && p.transactionRef.trim().toUpperCase() === cleanRef
      );
      if (duplicateTxn) {
        throw new Error(`Duplicate Transaction Reference: Payment reference "${params.transactionRef}" was already recorded under receipt ${duplicateTxn.receiptNumber} for student ${duplicateTxn.studentName}.`);
      }
    }

    const student = this.state.students.find((s) => s.id === params.studentId);
    if (!student) throw new Error('Student not found');

    const paymentId = `PAY-${Date.now()}`;
    const receiptNumber = `MCTC-REC-${new Date().getFullYear()}-${String(this.state.payments.length + 101).padStart(4, '0')}`;

    const createdAllocations: PaymentAllocation[] = params.allocations.map((a, i) => {
      const allocId = `ALC-${Date.now()}-${i}`;
      const newAlloc: PaymentAllocation = {
        id: allocId,
        paymentId,
        obligationId: a.obligationId,
        feeCategoryId: a.feeCategoryId,
        feeCategoryName: a.feeCategoryName,
        amountAllocated: a.amountAllocated,
        studentId: student.id,
        periodRef: a.periodRef || params.paymentDate,
        createdAt: new Date().toISOString(),
      };

      // If tied to an existing obligation, update its paid balance
      if (a.obligationId) {
        const obl = this.state.obligations.find((o) => o.id === a.obligationId);
        if (obl) {
          obl.amountPaid += a.amountAllocated;
          obl.balance = Math.max(0, obl.amountDue - obl.amountPaid);
          obl.status = obl.balance === 0 ? 'Paid' : obl.amountPaid > 0 ? 'Partially Paid' : 'Unpaid';
        }
      }

      this.state.paymentAllocations.push(newAlloc);
      return newAlloc;
    });

    const payment: Payment = {
      id: paymentId,
      receiptNumber,
      studentId: student.id,
      studentName: student.fullName,
      classId: student.classId,
      className: student.className,
      totalAmount: params.totalAmount,
      paymentDate: params.paymentDate,
      paymentMethod: params.paymentMethod,
      transactionRef: params.transactionRef,
      collectorId: params.collector.id,
      collectorName: params.collector.name,
      status: 'Completed',
      notes: params.notes,
      academicYear: '2026/2027',
      term: 'Term 1',
      createdAt: new Date().toISOString(),
      allocations: createdAllocations,
    };

    this.state.payments.push(payment);

    // Compute remaining student balance after payment
    const studentProfile = this.getStudentById(student.id);
    const balanceRemaining = studentProfile ? studentProfile.totalOutstanding : 0;

    const result = {
      payment,
      receipt: {
        receiptNumber,
        schoolName: 'Melstar Children Training Centre',
        location: 'New Gbawe, Greater Accra, Ghana',
        motto: 'Solid Foundation, Bright Future',
        paymentDate: params.paymentDate,
        studentName: student.fullName,
        admissionNumber: student.admissionNumber,
        className: student.className,
        parentName: student.parentName,
        parentPhone: student.parentPhone,
        totalReceived: params.totalAmount,
        paymentMethod: params.paymentMethod,
        transactionRef: params.transactionRef || 'N/A',
        collectorName: params.collector.name,
        notes: params.notes || 'Payment successfully processed',
        allocations: createdAllocations,
        outstandingBalanceAfterPayment: balanceRemaining,
      },
    };

    if (params.idempotencyKey) {
      this.logJournal(
        params.idempotencyKey,
        'PAYMENT',
        params.totalAmount,
        paymentId,
        'Success',
        result
      );
    }

    this.addAuditLog({
      userId: params.collector.id,
      userName: params.collector.name,
      userRole: params.collector.roleName,
      action: 'COLLECT_PAYMENT',
      entity: 'Payment',
      entityId: paymentId,
      details: `Collected GH₵ ${params.totalAmount.toFixed(2)} (${params.paymentMethod}) for ${student.fullName} (Receipt: ${receiptNumber})`,
    });

    this.persist();

    // Asynchronously push to Google Sheets (non-blocking, logged if error)
    googleSheetsService
      .appendRecord('Payments', payment)
      .then(() => {
        createdAllocations.forEach((alloc) => {
          googleSheetsService.appendRecord('PaymentAllocations', alloc).catch(() => {});
        });
      })
      .catch((err) => {
        console.error('[GoogleSheets] Asynchronous payment append warning:', err.message);
      });

    return result;
  }

  // Payment Reversal (Audit-tracked, no silent delete)
  public reversePayment(paymentId: string, reason: string, user: User) {
    const payment = this.state.payments.find((p) => p.id === paymentId);
    if (!payment) throw new Error('Payment not found');
    if (payment.status === 'Reversed') throw new Error('Payment already reversed');

    payment.status = 'Reversed';

    // Reverse allocations from obligations
    payment.allocations.forEach((alloc) => {
      if (alloc.obligationId) {
        const obl = this.state.obligations.find((o) => o.id === alloc.obligationId);
        if (obl) {
          obl.amountPaid = Math.max(0, obl.amountPaid - alloc.amountAllocated);
          obl.balance = Math.max(0, obl.amountDue - obl.amountPaid);
          obl.status = obl.balance === 0 ? 'Paid' : obl.amountPaid > 0 ? 'Partially Paid' : 'Unpaid';
        }
      }
    });

    const reversal: PaymentReversal = {
      id: `REV-${Date.now()}`,
      paymentId: payment.id,
      receiptNumber: payment.receiptNumber,
      reason,
      reversedBy: user.id,
      reversedByName: user.name,
      reversedAt: new Date().toISOString(),
      amountReversed: payment.totalAmount,
      auditNotes: `Payment ${payment.receiptNumber} reversed by ${user.name}. Reason: ${reason}`,
    };
    this.state.paymentReversals.push(reversal);

    this.addAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: user.roleName,
      action: 'REVERSE_PAYMENT',
      entity: 'Payment',
      entityId: paymentId,
      details: `Reversed payment ${payment.receiptNumber} of GH₵ ${payment.totalAmount.toFixed(2)}. Reason: ${reason}`,
    });

    this.persist();
    return reversal;
  }

  public getPayments(filter?: { date?: string; studentId?: string; status?: string }) {
    let list = [...this.state.payments];
    if (filter?.date) {
      list = list.filter((p) => p.paymentDate === filter.date);
    }
    if (filter?.studentId) {
      list = list.filter((p) => p.studentId === filter.studentId);
    }
    if (filter?.status) {
      list = list.filter((p) => p.status === filter.status);
    }
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  // Feeding Expenses
  public getFeedingExpenses(startDate?: string, endDate?: string) {
    let list = [...this.state.feedingExpenses];
    if (startDate && endDate) {
      list = list.filter((e) => e.date >= startDate && e.date <= endDate);
    }
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }

  public addFeedingExpense(data: Omit<FeedingExpense, 'id' | 'createdAt'>, user: User) {
    const expense: FeedingExpense = {
      id: `EXP-FEED-${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString(),
    };
    this.state.feedingExpenses.push(expense);

    this.addAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: user.roleName,
      action: 'RECORD_EXPENSE',
      entity: 'FeedingExpense',
      entityId: expense.id,
      details: `Recorded feeding expense: GH₵ ${expense.totalCost.toFixed(2)} (${expense.foodItems}) from ${expense.supplier}`,
    });

    this.persist();
    return expense;
  }

  // Daily Closing
  public closeDay(date: string, user: User, notes?: string) {
    const dailyStats = this.getDashboardStats(date, 'Today');
    const closing: DailyClosing = {
      id: `CLS-${date.replace(/-/g, '')}`,
      date,
      totalExpected: dailyStats.totalEnrolled,
      totalPresent: dailyStats.studentsPresentToday,
      totalAbsent: dailyStats.studentsAbsentToday,
      totalLate: dailyStats.studentsLateToday,
      attendanceRate: dailyStats.attendancePercentage,
      expectedFeeding: dailyStats.expectedFeedingToday,
      collectedFeeding: dailyStats.feedingFeesCollectedToday,
      outstandingFeeding: dailyStats.outstandingFeedingToday,
      expectedClassFees: dailyStats.expectedClassFeesToday,
      collectedClassFees: dailyStats.classFeesCollectedToday,
      outstandingClassFees: dailyStats.outstandingClassFeesToday,
      otherFees: 0,
      cashTotal: dailyStats.paymentMethods.Cash || 0,
      momoTotal: dailyStats.paymentMethods['Mobile Money'] || 0,
      bankTotal: (dailyStats.paymentMethods['Bank Transfer'] || 0) + (dailyStats.paymentMethods['Card'] || 0),
      feedingExpensesTotal: dailyStats.feedingExpensesToday,
      netFeedingSurplus: dailyStats.netFeedingSurplusToday,
      closedBy: user.id,
      closedByName: user.name,
      closedAt: new Date().toISOString(),
      notes,
      status: 'Closed',
    };

    const existingIdx = this.state.dailyClosings.findIndex((c) => c.date === date);
    if (existingIdx >= 0) {
      this.state.dailyClosings[existingIdx] = closing;
    } else {
      this.state.dailyClosings.push(closing);
    }

    this.addAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: user.roleName,
      action: 'CLOSE_DAY',
      entity: 'DailyClosing',
      entityId: closing.id,
      details: `Generated daily closing report for ${date}: Attendance ${closing.attendanceRate}%, Collected GH₵ ${dailyStats.totalCollectedToday.toFixed(2)}`,
    });

    this.persist();
    return closing;
  }

  public getDailyClosings() {
    return this.state.dailyClosings.sort((a, b) => b.date.localeCompare(a.date));
  }

  // Dashboard & Calculation Engine
  public getDashboardStats(selectedDate: string = '2026-10-09', rangeOption: string = 'Today') {
    const activeStudents = this.state.students.filter((s) => s.status === 'Active');
    const totalEnrolled = activeStudents.length;

    // Today's attendance
    const attendanceToday = this.state.attendance.filter((a) => a.date === selectedDate);
    const presentToday = attendanceToday.filter((a) => a.status === 'Present').length;
    const lateToday = attendanceToday.filter((a) => a.status === 'Late').length;
    const absentToday = attendanceToday.filter((a) => a.status === 'Absent').length;
    const totalMarked = attendanceToday.length;
    const effectivePresent = presentToday + lateToday;
    const attendancePercentage = totalMarked > 0 ? (effectivePresent / totalMarked) * 100 : 0;

    // Collections today (payments made on selectedDate)
    const validPaymentsToday = this.state.payments.filter(
      (p) => p.paymentDate === selectedDate && p.status === 'Completed'
    );
    const totalCollectedToday = validPaymentsToday.reduce((sum, p) => sum + p.totalAmount, 0);

    // Breakdown: feeding fees vs class fees collected today
    let feedingFeesCollectedToday = 0;
    let classFeesCollectedToday = 0;
    validPaymentsToday.forEach((p) => {
      p.allocations.forEach((alc) => {
        if (alc.feeCategoryId === 'FC-FEED') {
          feedingFeesCollectedToday += alc.amountAllocated;
        } else {
          classFeesCollectedToday += alc.amountAllocated;
        }
      });
    });

    // Expected collections today based on fee obligations due on selectedDate
    const obligationsDueToday = this.state.obligations.filter((o) => o.dueDate === selectedDate);
    const expectedFeedingToday = obligationsDueToday
      .filter((o) => o.feeCategoryId === 'FC-FEED')
      .reduce((sum, o) => sum + o.amountDue, 0);
    const expectedClassFeesToday = obligationsDueToday
      .filter((o) => o.feeCategoryId !== 'FC-FEED')
      .reduce((sum, o) => sum + o.amountDue, 0);
    const totalExpectedToday = expectedFeedingToday + expectedClassFeesToday;

    const outstandingFeedingToday = Math.max(0, expectedFeedingToday - feedingFeesCollectedToday);
    const outstandingClassFeesToday = Math.max(0, expectedClassFeesToday - classFeesCollectedToday);
    const totalOutstandingToday = Math.max(0, totalExpectedToday - totalCollectedToday);

    // Collections this week (2026-10-05 to 2026-10-09)
    const weekStart = '2026-10-05';
    const weekEnd = '2026-10-09';
    const weekPayments = this.state.payments.filter(
      (p) => p.paymentDate >= weekStart && p.paymentDate <= weekEnd && p.status === 'Completed'
    );
    const totalCollectionsThisWeek = weekPayments.reduce((sum, p) => sum + p.totalAmount, 0);

    // Collections this month (2026-10-01 to 2026-10-31)
    const monthStart = '2026-10-01';
    const monthPayments = this.state.payments.filter(
      (p) => p.paymentDate >= monthStart && p.status === 'Completed'
    );
    const totalCollectionsThisMonth = monthPayments.reduce((sum, p) => sum + p.totalAmount, 0);

    // Total outstanding student balances (all active unpaid obligations + opening balances)
    let totalOutstandingBalances = 0;
    activeStudents.forEach((stu) => {
      const stuProfile = this.getStudentById(stu.id);
      if (stuProfile) {
        totalOutstandingBalances += stuProfile.totalOutstanding;
      }
    });

    // Feeding expenses today & week
    const expensesToday = this.state.feedingExpenses.filter((e) => e.date === selectedDate);
    const feedingExpensesToday = expensesToday.reduce((sum, e) => sum + e.totalCost, 0);
    const netFeedingSurplusToday = feedingFeesCollectedToday - feedingExpensesToday;

    const expensesThisWeek = this.state.feedingExpenses.filter(
      (e) => e.date >= weekStart && e.date <= weekEnd
    );
    const totalFeedingExpensesWeek = expensesThisWeek.reduce((sum, e) => sum + e.totalCost, 0);

    let feedingCollectedWeek = 0;
    weekPayments.forEach((p) => {
      p.allocations.forEach((a) => {
        if (a.feeCategoryId === 'FC-FEED') feedingCollectedWeek += a.amountAllocated;
      });
    });
    const netFeedingSurplusWeek = feedingCollectedWeek - totalFeedingExpensesWeek;

    // Payment methods breakdown today
    const paymentMethods: Record<string, number> = {};
    validPaymentsToday.forEach((p) => {
      paymentMethods[p.paymentMethod] = (paymentMethods[p.paymentMethod] || 0) + p.totalAmount;
    });

    // Collections by collector
    const collectionsByCollector: Record<string, number> = {};
    validPaymentsToday.forEach((p) => {
      collectionsByCollector[p.collectorName] = (collectionsByCollector[p.collectorName] || 0) + p.totalAmount;
    });

    // Class attendance comparisons
    const attendanceByClass: Array<{ className: string; present: number; absent: number; rate: number }> = [];
    const outstandingByClass: Array<{ className: string; amount: number }> = [];

    this.state.classes.forEach((c) => {
      const clsStudents = activeStudents.filter((s) => s.classId === c.id);
      const clsAttendance = attendanceToday.filter((a) => a.classId === c.id);
      const pr = clsAttendance.filter((a) => a.status === 'Present' || a.status === 'Late').length;
      const ab = clsAttendance.filter((a) => a.status === 'Absent').length;
      const rate = clsAttendance.length > 0 ? (pr / clsAttendance.length) * 100 : 0;
      attendanceByClass.push({
        className: c.name,
        present: pr,
        absent: ab,
        rate: Math.round(rate),
      });

      let clsDebt = 0;
      clsStudents.forEach((s) => {
        const prof = this.getStudentById(s.id);
        if (prof) clsDebt += prof.totalOutstanding;
      });
      outstandingByClass.push({
        className: c.name,
        amount: clsDebt,
      });
    });

    // Daily collection trend for current week (Mon-Fri)
    const dailyCollectionsTrend = [
      { date: '2026-10-05', day: 'Mon', feeding: 100, classFee: 0, total: 100 },
      { date: '2026-10-06', day: 'Tue', feeding: 120, classFee: 150, total: 270 },
      { date: '2026-10-07', day: 'Wed', feeding: 140, classFee: 200, total: 340 },
      { date: '2026-10-08', day: 'Thu', feeding: 160, classFee: 450, total: 610 },
      { date: '2026-10-09', day: 'Fri (Today)', feeding: feedingFeesCollectedToday, classFee: classFeesCollectedToday, total: totalCollectedToday },
    ];

    return {
      selectedDate,
      rangeOption,
      totalEnrolled,
      studentsPresentToday: effectivePresent,
      studentsAbsentToday: absentToday,
      studentsLateToday: lateToday,
      attendancePercentage: Math.round(attendancePercentage * 10) / 10,
      totalExpectedToday,
      totalCollectedToday,
      totalOutstandingToday,
      expectedFeedingToday,
      feedingFeesCollectedToday,
      outstandingFeedingToday,
      expectedClassFeesToday,
      classFeesCollectedToday,
      outstandingClassFeesToday,
      totalCollectionsThisWeek,
      totalCollectionsThisMonth,
      totalOutstandingBalances,
      feedingExpensesToday,
      netFeedingSurplusToday,
      feedingExpensesWeek: totalFeedingExpensesWeek,
      feedingCollectedWeek,
      netFeedingSurplusWeek,
      paymentMethods,
      collectionsByCollector,
      attendanceByClass,
      outstandingByClass,
      dailyCollectionsTrend,
    };
  }

  // Outstanding fees list
  public getOutstandingFeesReport(classId?: string) {
    const activeStudents = this.getStudents({ classId, status: 'Active' });
    const list: Array<{
      studentId: string;
      admissionNumber: string;
      fullName: string;
      className: string;
      parentName: string;
      parentPhone: string;
      feedingArrangement: string;
      openingBalance: number;
      unpaidObligations: FeeObligation[];
      totalOutstanding: number;
      lastPaymentDate?: string;
      daysOverdue: number;
    }> = [];

    activeStudents.forEach((stu) => {
      const prof = this.getStudentById(stu.id);
      if (prof && prof.totalOutstanding > 0) {
        const unpaid = prof.obligations.filter((o) => o.status !== 'Paid');
        const lastPay = prof.payments.length > 0 ? prof.payments[0].paymentDate : undefined;

        list.push({
          studentId: stu.id,
          admissionNumber: stu.admissionNumber,
          fullName: stu.fullName,
          className: stu.className,
          parentName: stu.parentName,
          parentPhone: stu.parentPhone,
          feedingArrangement: stu.feedingArrangement,
          openingBalance: stu.openingBalance,
          unpaidObligations: unpaid,
          totalOutstanding: prof.totalOutstanding,
          lastPaymentDate: lastPay,
          daysOverdue: Math.floor(Math.random() * 15) + 3,
        });
      }
    });

    return list.sort((a, b) => b.totalOutstanding - a.totalOutstanding);
  }

  // Raw sheets export
  public getAllSheetsData(): Record<string, any[]> {
    return {
      Settings: Object.entries(this.state.settings).map(([k, v]) => ({
        key: k,
        value: v,
        description: 'Melstar ERP System Configuration',
        updatedAt: new Date().toISOString(),
        updatedBy: 'System',
      })),
      Users: this.state.users,
      Roles: [
        { id: 'ROL-DIR', name: 'Director', description: 'Overall school governance, strategic oversight, financial audit', permissions: 'ALL' },
        { id: 'ROL-PROP', name: 'Proprietress', description: 'Executive proprietorship, full institutional authority', permissions: 'ALL' },
        { id: 'ROL-GM', name: 'General Manager', description: 'Full executive oversight, financial reports', permissions: 'ALL_OPERATIONS' },
        { id: 'ROL-ADM', name: 'Administrator', description: 'Student enrollment, class management, attendance register oversight, daily operations', permissions: 'ACADEMIC_OPS' },
        { id: 'ROL-ACC', name: 'Accountant', description: 'Expenses, bank reconciliation, financial audit', permissions: 'FINANCIALS_EXPENSES' },
        { id: 'ROL-CASH', name: 'Cashier or Fee Collector', description: 'Fee payments, receipts, cash counts', permissions: 'COLLECTION_RECEIPTS' },
      ],
      Students: this.state.students,
      Classes: this.state.classes,
      AcademicYears: this.state.academicYears,
      AcademicTerms: this.state.academicTerms,
      SchoolCalendar: this.state.calendarEvents,
      FeeCategories: this.state.feeCategories,
      FeeSchedules: [],
      FeeObligations: this.state.obligations,
      FeeAdjustments: [],
      Payments: this.state.payments,
      PaymentAllocations: this.state.paymentAllocations,
      PaymentReversals: this.state.paymentReversals,
      Attendance: this.state.attendance,
      FeedingExpenses: this.state.feedingExpenses,
      ExpenseCategories: [
        { id: 'EXP-CAT-FOOD', name: 'Raw Foodstuff & Ingredients', description: 'Rice, fish, meat, vegetables, oil', budgetGHS: 3500 },
        { id: 'EXP-CAT-GAS', name: 'Kitchen Gas & Fuel', description: 'LPG cylinders refill', budgetGHS: 600 },
        { id: 'EXP-CAT-WATER', name: 'Drinking Water Sachets', description: 'Purified water bags', budgetGHS: 400 },
      ],
      DailyClosings: this.state.dailyClosings,
      CashierSessions: [],
      CashierMovements: [],
      Notifications: [],
      AuditLogs: this.state.auditLogs,
      TransactionJournal: this.state.transactionJournal,
      DataImportLogs: [],
    };
  }
}

export const db = new Database();
