export type RoleType = 
  | 'Director'
  | 'Proprietress'
  | 'General Manager'
  | 'Administrator'
  | 'Cashier or Fee Collector'
  | 'Accountant';

export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  password?: string;
  phone: string;
  roleId: string;
  roleName: RoleType;
  assignedClassId?: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
  lastLogin?: string;
}

export interface RolePermissions {
  role: RoleType;
  description: string;
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


export interface Student {
  id: string;
  admissionNumber: string;
  fullName: string;
  gender: 'Male' | 'Female';
  dateOfBirth: string;
  classId: string;
  className: string;
  academicYear: string;
  admissionDate: string;
  status: 'Active' | 'Inactive' | 'Transferred' | 'Graduated';
  parentName: string;
  parentPhone: string;
  altPhone?: string;
  location?: string;
  emergencyContact?: string;
  feedingArrangement: 'Daily' | 'Weekly' | 'Exempt';
  customFeedingFee?: number; // default is class default (e.g. 10 GHS daily)
  customClassFee?: number;
  openingBalance: number; // arrears from previous term/year
  adminNotes?: string;
  createdAt: string;
}

export interface SchoolClass {
  id: string;
  name: string;
  gradeLevel: number;
  academicYear: string;
  classTeacherId: string;
  classTeacherName: string;
  defaultClassFee: number; // e.g. 350 GHS per term or 25 GHS weekly
  defaultFeedingFee: number; // e.g. 10 GHS daily
  feedingSchedule: 'Daily' | 'Weekly';
  classFeeSchedule: 'Daily' | 'Weekly' | 'Termly';
  status: 'Active' | 'Archived';
  enrolledCount?: number;
}

export interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Past' | 'Upcoming';
  isCurrent: boolean;
}

export interface AcademicTerm {
  id: string;
  academicYearId: string;
  name: string; // "Term 1", "Term 2", "Term 3"
  termNumber: number;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface CalendarEvent {
  id: string;
  date: string;
  academicYear: string;
  term: string;
  eventType: 'School Day' | 'Public Holiday' | 'Mid-Term Break' | 'Special Event' | 'Non-Feeding Day';
  description: string;
  isFeedingDay: boolean;
  isSchoolDay: boolean;
}

export interface FeeCategory {
  id: string;
  name: string; // 'Feeding Fee', 'Class Fee / Tuition', 'PTA Levy', 'Uniform / Books'
  code: string;
  description: string;
  defaultFrequency: 'Daily' | 'Weekly' | 'Termly' | 'One-Time';
  isActive: boolean;
}

export interface FeeObligation {
  id: string;
  studentId: string;
  feeCategoryId: string;
  feeCategoryName: string;
  periodType: 'Daily' | 'Weekly' | 'Termly';
  periodRef: string; // e.g. "2026-10-09" for daily, "2026-W41" for weekly, "2026-Term-1"
  dueDate: string;
  amountDue: number;
  amountPaid: number;
  balance: number;
  status: 'Unpaid' | 'Partially Paid' | 'Paid' | 'Exempt' | 'Waived';
  academicYear: string;
  term: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late' | 'Excused' | 'School-approved activity';
  arrivalTime?: string;
  recordedBy: string;
  recordedByName: string;
  recordedAt: string;
  notes?: string;
}

export interface PaymentAllocation {
  id: string;
  paymentId: string;
  obligationId?: string;
  feeCategoryId: string;
  feeCategoryName: string;
  amountAllocated: number;
  studentId: string;
  periodRef?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  receiptNumber: string;
  studentId: string;
  studentName: string;
  classId: string;
  className?: string;
  totalAmount: number;
  paymentDate: string;
  paymentMethod: 'Cash' | 'Mobile Money' | 'Bank Transfer' | 'Card' | 'Cheque';
  transactionRef?: string; // MoMo TxID / Bank Ref
  collectorId: string;
  collectorName: string;
  status: 'Completed' | 'Reversed';
  notes?: string;
  academicYear: string;
  term: string;
  createdAt: string;
  allocations: PaymentAllocation[];
}

export interface PaymentReversal {
  id: string;
  paymentId: string;
  receiptNumber: string;
  reason: string;
  reversedBy: string;
  reversedByName: string;
  reversedAt: string;
  amountReversed: number;
  auditNotes?: string;
}

export interface FeedingExpense {
  id: string;
  date: string;
  supplier: string;
  description: string;
  foodItems: string; // e.g. "50kg Jasmine Rice, 1 Carton Mackerel"
  quantity: string;
  unitCost: number;
  totalCost: number;
  paymentMethod: 'Cash' | 'Mobile Money' | 'Bank Transfer';
  receiptRef?: string;
  recordedBy: string;
  recordedByName: string;
  approvalStatus: 'Approved' | 'Pending' | 'Rejected';
  createdAt: string;
}

export interface DailyClosing {
  id: string;
  date: string;
  totalExpected: number;
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  attendanceRate: number;
  expectedFeeding: number;
  collectedFeeding: number;
  outstandingFeeding: number;
  expectedClassFees: number;
  collectedClassFees: number;
  outstandingClassFees: number;
  otherFees: number;
  cashTotal: number;
  momoTotal: number;
  bankTotal: number;
  feedingExpensesTotal: number;
  netFeedingSurplus: number;
  closedBy: string;
  closedByName: string;
  closedAt: string;
  notes?: string;
  status: 'Closed' | 'Draft';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  ipAddress?: string;
}

export interface TransactionJournalEntry {
  id: string;
  idempotencyKey: string;
  timestamp: string;
  type: string;
  amount: number;
  referenceId: string;
  status: 'Success' | 'Failed';
  payloadJson: string;
}

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  serviceAccountEmail: string;
  privateKeyConfigured: boolean;
  isConnected: boolean;
  lastSyncTime?: string;
  worksheetsCount: number;
  mode: 'demo_local' | 'live_sheets';
}
