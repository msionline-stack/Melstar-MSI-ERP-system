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
  customFeedingFee?: number;
  customClassFee?: number;
  openingBalance: number;
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
  defaultClassFee: number;
  defaultFeedingFee: number;
  feedingSchedule: 'Daily' | 'Weekly';
  classFeeSchedule: 'Daily' | 'Weekly' | 'Termly';
  status: 'Active' | 'Archived';
  enrolledCount?: number;
}

export interface FeeObligation {
  id: string;
  studentId: string;
  feeCategoryId: string;
  feeCategoryName: string;
  periodType: 'Daily' | 'Weekly' | 'Termly';
  periodRef: string;
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
  transactionRef?: string;
  collectorId: string;
  collectorName: string;
  status: 'Completed' | 'Reversed';
  notes?: string;
  academicYear: string;
  term: string;
  createdAt: string;
  allocations: PaymentAllocation[];
}

export interface FeedingExpense {
  id: string;
  date: string;
  supplier: string;
  description: string;
  foodItems: string;
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

export interface DashboardStats {
  selectedDate: string;
  rangeOption: string;
  totalEnrolled: number;
  studentsPresentToday: number;
  studentsAbsentToday: number;
  studentsLateToday: number;
  attendancePercentage: number;
  totalExpectedToday: number;
  totalCollectedToday: number;
  totalOutstandingToday: number;
  expectedFeedingToday: number;
  feedingFeesCollectedToday: number;
  outstandingFeedingToday: number;
  expectedClassFeesToday: number;
  classFeesCollectedToday: number;
  outstandingClassFeesToday: number;
  totalCollectionsThisWeek: number;
  totalCollectionsThisMonth: number;
  totalOutstandingBalances: number;
  feedingExpensesToday: number;
  netFeedingSurplusToday: number;
  feedingExpensesWeek: number;
  feedingCollectedWeek: number;
  netFeedingSurplusWeek: number;
  paymentMethods: Record<string, number>;
  collectionsByCollector: Record<string, number>;
  attendanceByClass: Array<{ className: string; present: number; absent: number; rate: number }>;
  outstandingByClass: Array<{ className: string; amount: number }>;
  dailyCollectionsTrend: Array<{ date: string; day: string; feeding: number; classFee: number; total: number }>;
}

export interface DailyFeedingRow {
  studentId: string;
  admissionNumber: string;
  fullName: string;
  className: string;
  classId: string;
  parentPhone: string;
  feedingArrangement: 'Daily' | 'Weekly' | 'Exempt';
  attendanceStatus: string;
  feeDue: number;
  amountPaid: number;
  outstanding: number;
  paymentStatus: 'Paid' | 'Partially Paid' | 'Unpaid' | 'Exempt' | 'Weekly Covered';
  collectorName: string;
  receiptNumber: string;
  paymentMethod: string;
}

export interface WeeklyFeedingRow {
  studentId: string;
  admissionNumber: string;
  fullName: string;
  className: string;
  classId: string;
  parentPhone: string;
  feedingArrangement: 'Daily' | 'Weekly' | 'Exempt';
  scheduledDays: number;
  daysPresent: number;
  daysAbsent: number;
  expectedWeeklyFee: number;
  totalPaidWeekly: number;
  outstandingBalance: number;
  paymentStatus: 'Paid' | 'Partially Paid' | 'Unpaid';
}

export interface OutstandingReportRow {
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
}
