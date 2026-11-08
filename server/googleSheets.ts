import { google, sheets_v4 } from 'googleapis';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

// The 25 worksheets required by Section 16 of the ERP specification
export const SHEET_SCHEMAS: Record<string, string[]> = {
  Settings: ['key', 'value', 'description', 'updatedAt', 'updatedBy'],
  Users: ['id', 'name', 'email', 'phone', 'roleId', 'roleName', 'assignedClassId', 'status', 'createdAt', 'lastLogin'],
  Roles: ['id', 'name', 'description', 'permissions'],
  Students: [
    'id', 'admissionNumber', 'fullName', 'gender', 'dateOfBirth', 'classId',
    'className', 'academicYear', 'admissionDate', 'status', 'parentName',
    'parentPhone', 'altPhone', 'location', 'emergencyContact', 'feedingArrangement',
    'customFeedingFee', 'customClassFee', 'openingBalance', 'adminNotes', 'createdAt'
  ],
  Classes: [
    'id', 'name', 'gradeLevel', 'academicYear', 'classTeacherId', 'classTeacherName',
    'defaultClassFee', 'defaultFeedingFee', 'feedingSchedule', 'classFeeSchedule', 'status'
  ],
  AcademicYears: ['id', 'name', 'startDate', 'endDate', 'status', 'isCurrent'],
  AcademicTerms: ['id', 'academicYearId', 'name', 'termNumber', 'startDate', 'endDate', 'isCurrent'],
  SchoolCalendar: ['id', 'date', 'academicYear', 'term', 'eventType', 'description', 'isFeedingDay', 'isSchoolDay'],
  FeeCategories: ['id', 'name', 'code', 'description', 'defaultFrequency', 'isActive'],
  FeeSchedules: ['id', 'classId', 'feeCategoryId', 'frequency', 'amount', 'academicYearId', 'termId', 'effectiveFrom', 'status'],
  FeeObligations: [
    'id', 'studentId', 'feeCategoryId', 'feeCategoryName', 'periodType', 'periodRef',
    'dueDate', 'amountDue', 'amountPaid', 'balance', 'status', 'academicYear', 'term', 'createdAt'
  ],
  FeeAdjustments: ['id', 'obligationId', 'studentId', 'adjustmentType', 'amount', 'reason', 'approvedBy', 'date', 'status'],
  Payments: [
    'id', 'receiptNumber', 'studentId', 'studentName', 'classId', 'totalAmount',
    'paymentDate', 'paymentMethod', 'transactionRef', 'collectorId', 'collectorName',
    'status', 'notes', 'academicYear', 'term', 'createdAt'
  ],
  PaymentAllocations: ['id', 'paymentId', 'obligationId', 'feeCategoryId', 'feeCategoryName', 'amountAllocated', 'studentId', 'createdAt'],
  PaymentReversals: ['id', 'paymentId', 'receiptNumber', 'reason', 'reversedBy', 'reversedAt', 'amountReversed', 'auditNotes'],
  Attendance: ['id', 'studentId', 'studentName', 'classId', 'className', 'date', 'status', 'arrivalTime', 'recordedBy', 'recordedByName', 'recordedAt', 'notes'],
  FeedingExpenses: [
    'id', 'date', 'supplier', 'description', 'foodItems', 'quantity', 'unitCost',
    'totalCost', 'paymentMethod', 'receiptRef', 'recordedBy', 'recordedByName', 'approvalStatus', 'createdAt'
  ],
  ExpenseCategories: ['id', 'name', 'description', 'budgetGHS'],
  DailyClosings: [
    'id', 'date', 'totalExpected', 'totalPresent', 'totalAbsent', 'totalLate', 'attendanceRate',
    'expectedFeeding', 'collectedFeeding', 'outstandingFeeding', 'expectedClassFees',
    'collectedClassFees', 'outstandingClassFees', 'otherFees', 'cashTotal', 'momoTotal',
    'bankTotal', 'feedingExpensesTotal', 'netFeedingSurplus', 'closedBy', 'closedByName',
    'closedAt', 'notes', 'status'
  ],
  CashierSessions: ['id', 'cashierId', 'cashierName', 'openedAt', 'closedAt', 'openingFloat', 'totalCollected', 'closingCount', 'difference', 'status'],
  CashierMovements: ['id', 'sessionId', 'type', 'amount', 'reason', 'timestamp', 'recordedBy'],
  Notifications: ['id', 'recipientRole', 'title', 'message', 'severity', 'isRead', 'createdAt'],
  AuditLogs: ['id', 'timestamp', 'userId', 'userName', 'userRole', 'action', 'entity', 'entityId', 'details', 'ipAddress'],
  TransactionJournal: ['id', 'idempotencyKey', 'timestamp', 'type', 'amount', 'referenceId', 'status', 'payloadJson'],
  DataImportLogs: ['id', 'timestamp', 'source', 'recordCount', 'status', 'performedBy', 'notes'],
};

export class GoogleSheetsService {
  private serviceAccountEmail: string | undefined;
  private privateKey: string | undefined;
  private spreadsheetId: string | undefined;
  private projectId: string | undefined;
  private timezone: string;
  private currency: string;
  private cachedSheetsInstance: sheets_v4.Sheets | null = null;
  private writeQueue: Promise<any> = Promise.resolve();

  constructor() {
    this.timezone = process.env.TZ || 'Africa/Accra';
    this.currency = process.env.CURRENCY || 'GHS';
    this.reloadConfig();
  }

  public reloadConfig(customConfig?: {
    email?: string;
    privateKey?: string;
    spreadsheetId?: string;
    projectId?: string;
  }) {
    if (customConfig) {
      if (customConfig.email) this.serviceAccountEmail = customConfig.email.trim();
      if (customConfig.privateKey) {
        this.privateKey = customConfig.privateKey.replace(/\\n/g, '\n').trim();
      }
      if (customConfig.spreadsheetId) this.spreadsheetId = customConfig.spreadsheetId.trim();
      if (customConfig.projectId) this.projectId = customConfig.projectId.trim();
      this.cachedSheetsInstance = null;
      return;
    }

    this.serviceAccountEmail =
      process.env.GOOGLE_SERVICE_ACCOUNT || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    this.spreadsheetId = process.env.GOOGLE_SHEET_ID;
    this.projectId = process.env.GOOGLE_PROJECT_ID;
    const rawTz = process.env.TZ;
    this.timezone = rawTz && rawTz.includes('Accra') ? rawTz : 'Africa/Accra';
    this.currency = process.env.CURRENCY || 'GHS';

    let key = process.env.GOOGLE_PRIVATE_KEY;
    if (key) {
      this.privateKey = key.replace(/\\n/g, '\n').trim();
    }
    this.cachedSheetsInstance = null;
  }

  public getStatus() {
    return {
      spreadsheetId: this.spreadsheetId || '',
      serviceAccountEmail: this.serviceAccountEmail || '',
      projectId: this.projectId || '',
      timezone: this.timezone,
      currency: this.currency,
      privateKeyConfigured: !!(this.privateKey && this.privateKey.length > 20),
      isConfigured: !!(this.spreadsheetId && this.serviceAccountEmail && this.privateKey),
      totalWorksheetsRequired: Object.keys(SHEET_SCHEMAS).length,
    };
  }

  private getSheetsClient(): sheets_v4.Sheets {
    if (this.cachedSheetsInstance) {
      return this.cachedSheetsInstance;
    }

    if (!this.serviceAccountEmail || !this.privateKey) {
      throw new Error(
        'Google Service Account email and private key are not configured in environment (GOOGLE_SERVICE_ACCOUNT, GOOGLE_PRIVATE_KEY).'
      );
    }
    if (!this.spreadsheetId) {
      throw new Error('Google Spreadsheet ID is not configured (GOOGLE_SHEET_ID).');
    }

    const auth = new google.auth.JWT({
      email: this.serviceAccountEmail,
      key: this.privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    this.cachedSheetsInstance = google.sheets({ version: 'v4', auth });
    return this.cachedSheetsInstance;
  }

  /**
   * Test connection and retrieve spreadsheet details
   */
  public async testConnection(): Promise<{
    success: boolean;
    message: string;
    title?: string;
    existingSheets?: string[];
    spreadsheetId?: string;
    serviceAccount?: string;
    timezone?: string;
    currency?: string;
  }> {
    if (!this.spreadsheetId) {
      return { success: false, message: 'Google Spreadsheet ID (GOOGLE_SHEET_ID) is not configured.' };
    }
    if (!this.serviceAccountEmail || !this.privateKey) {
      return {
        success: false,
        message: 'Google Service Account credentials (GOOGLE_SERVICE_ACCOUNT or GOOGLE_PRIVATE_KEY) are missing.',
      };
    }

    try {
      const sheets = this.getSheetsClient();
      const res = await sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });

      const sheetNames = (res.data.sheets || []).map((s) => s.properties?.title || '').filter(Boolean);
      return {
        success: true,
        message: `Successfully connected to Google Spreadsheet: "${res.data.properties?.title}" using Service Account "${this.serviceAccountEmail}".`,
        title: res.data.properties?.title || 'Master ERP Spreadsheet',
        existingSheets: sheetNames,
        spreadsheetId: this.spreadsheetId,
        serviceAccount: this.serviceAccountEmail,
        timezone: this.timezone,
        currency: this.currency,
      };
    } catch (err: any) {
      console.error('[GoogleSheetsService] testConnection failed:', err.message);
      return {
        success: false,
        message: `Google Sheets connection failed: ${err.message || 'Unknown error'}. Ensure the sheet "${this.spreadsheetId}" is shared with ${this.serviceAccountEmail} with Editor permissions.`,
      };
    }
  }

  /**
   * Ensures all 25 tabs exist with correct header rows, preserving existing column headers and data
   */
  public async initializeSheets(): Promise<{
    success: boolean;
    createdSheets: string[];
    existingSheets: string[];
    message: string;
  }> {
    return this.queueOperation(async () => {
      const sheets = this.getSheetsClient();
      const spreadsheetId = this.spreadsheetId!;

      // 1. Get current sheets
      const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
      const currentSheetNames = new Set(
        (spreadsheet.data.sheets || []).map((s) => s.properties?.title || '').filter(Boolean)
      );

      const requiredSheets = Object.keys(SHEET_SCHEMAS);
      const sheetsToCreate = requiredSheets.filter((name) => !currentSheetNames.has(name));
      const createdSheets: string[] = [];

      // 2. Batch-add missing worksheets
      if (sheetsToCreate.length > 0) {
        const requests = sheetsToCreate.map((title) => ({
          addSheet: {
            properties: { title },
          },
        }));

        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: { requests },
        });
        createdSheets.push(...sheetsToCreate);
      }

      // 3. Batch check existing headers across all required sheets in ONE call
      const ranges = requiredSheets.map((s) => `'${s}'!1:1`);
      const batchRes = await sheets.spreadsheets.values.batchGet({
        spreadsheetId,
        ranges,
      });

      const valueRangesToWrite: sheets_v4.Schema$ValueRange[] = [];
      const returnedValueRanges = batchRes.data.valueRanges || [];

      requiredSheets.forEach((sheetName, index) => {
        const vr = returnedValueRanges[index];
        const existingValues = vr?.values;
        if (!existingValues || existingValues.length === 0 || existingValues[0].length === 0) {
          valueRangesToWrite.push({
            range: `'${sheetName}'!A1`,
            values: [SHEET_SCHEMAS[sheetName]],
          });
        }
      });

      if (valueRangesToWrite.length > 0) {
        await sheets.spreadsheets.values.batchUpdate({
          spreadsheetId,
          requestBody: {
            valueInputOption: 'USER_ENTERED',
            data: valueRangesToWrite,
          },
        });
      }

      return {
        success: true,
        createdSheets,
        existingSheets: Array.from(currentSheetNames),
        message: `Verified all ${requiredSheets.length} worksheets (${createdSheets.length} newly provisioned) with standardized columns.`,
      };
    });
  }

  /**
   * Generic Read: Read all records from a spreadsheet tab as objects
   */
  public async readTab<T = any>(tabName: string): Promise<T[]> {
    const sheets = this.getSheetsClient();
    const spreadsheetId = this.spreadsheetId!;

    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'${tabName}'!A1:ZZ50000`,
      });

      const values = res.data.values;
      if (!values || values.length <= 1) {
        return [];
      }

      const headers = values[0] as string[];
      const rows = values.slice(1);

      return rows.map((row) => {
        const item: any = {};
        headers.forEach((header, index) => {
          if (!header) return;
          const raw = row[index];
          if (raw === undefined || raw === null || raw === '') {
            item[header] = '';
          } else {
            // Auto parse JSON if object/array
            if (typeof raw === 'string' && (raw.startsWith('{') || raw.startsWith('['))) {
              try {
                item[header] = JSON.parse(raw);
                return;
              } catch (_) {
                // Keep string
              }
            }
            // Auto parse numbers if purely numeric
            if (typeof raw === 'string' && /^-?\d+(\.\d+)?$/.test(raw.trim()) && !raw.startsWith('0') && raw.length < 15) {
              const num = Number(raw);
              if (!isNaN(num)) {
                item[header] = num;
                return;
              }
            }
            item[header] = raw;
          }
        });
        return item as T;
      });
    } catch (err: any) {
      console.error(`[GoogleSheetsService] readTab failed for "${tabName}":`, err.message);
      throw new Error(`Failed to read tab "${tabName}" from Google Sheets: ${err.message}`);
    }
  }

  /**
   * Generic Append: Append a single record to the designated sheet
   */
  public async appendRecord(tabName: string, record: Record<string, any>): Promise<{ success: boolean; rowNumber?: number }> {
    return this.queueOperation(async () => {
      const sheets = this.getSheetsClient();
      const spreadsheetId = this.spreadsheetId!;

      // Get existing headers
      const headerRes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'${tabName}'!1:1`,
      });

      let headers: string[] = (headerRes.data.values && headerRes.data.values[0]) || SHEET_SCHEMAS[tabName] || [];
      if (headers.length === 0) {
        headers = Object.keys(record);
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `'${tabName}'!A1`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [headers] },
        });
      }

      const rowValues = headers.map((h) => {
        let val = record[h];
        if (val === undefined || val === null) return '';
        if (typeof val === 'object') return JSON.stringify(val);
        val = String(val);
        if (val.startsWith('+')) {
          val = `'${val}`;
        }
        return val;
      });

      const res = await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `'${tabName}'!A1`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [rowValues],
        },
      });

      return {
        success: true,
        rowNumber: res.data.updates?.updatedRows ?? undefined,
      };
    });
  }

  /**
   * Generic Update: Find row by a key column (e.g., 'id') and update fields
   */
  public async updateRecord(
    tabName: string,
    keyField: string,
    keyValue: string,
    updates: Record<string, any>
  ): Promise<{ success: boolean; updated: boolean }> {
    return this.queueOperation(async () => {
      const sheets = this.getSheetsClient();
      const spreadsheetId = this.spreadsheetId!;

      const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'${tabName}'!A1:ZZ50000`,
      });

      const values = res.data.values;
      if (!values || values.length <= 1) {
        return { success: false, updated: false };
      }

      const headers = values[0] as string[];
      const keyColIdx = headers.indexOf(keyField);
      if (keyColIdx === -1) {
        throw new Error(`Key field "${keyField}" not found in sheet "${tabName}"`);
      }

      let targetRowIdx = -1;
      for (let i = 1; i < values.length; i++) {
        if (String(values[i][keyColIdx] || '').trim() === String(keyValue).trim()) {
          targetRowIdx = i + 1; // 1-based index in sheets
          break;
        }
      }

      if (targetRowIdx === -1) {
        return { success: false, updated: false };
      }

      const existingRow = values[targetRowIdx - 1];
      const newRow = headers.map((h, idx) => {
        if (h in updates) {
          const val = updates[h];
          if (val === undefined || val === null) return '';
          if (typeof val === 'object') return JSON.stringify(val);
          return String(val);
        }
        return existingRow[idx] !== undefined ? existingRow[idx] : '';
      });

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${tabName}'!A${targetRowIdx}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [newRow],
        },
      });

      return { success: true, updated: true };
    });
  }

  /**
   * Generic Delete: Clear row content by key
   */
  public async deleteRecord(
    tabName: string,
    keyField: string,
    keyValue: string
  ): Promise<{ success: boolean; deleted: boolean }> {
    return this.queueOperation(async () => {
      const sheets = this.getSheetsClient();
      const spreadsheetId = this.spreadsheetId!;

      const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'${tabName}'!A1:ZZ50000`,
      });

      const values = res.data.values;
      if (!values || values.length <= 1) {
        return { success: false, deleted: false };
      }

      const headers = values[0] as string[];
      const keyColIdx = headers.indexOf(keyField);
      if (keyColIdx === -1) {
        throw new Error(`Key field "${keyField}" not found in sheet "${tabName}"`);
      }

      let targetRowIdx = -1;
      for (let i = 1; i < values.length; i++) {
        if (String(values[i][keyColIdx] || '').trim() === String(keyValue).trim()) {
          targetRowIdx = i + 1;
          break;
        }
      }

      if (targetRowIdx === -1) {
        return { success: false, deleted: false };
      }

      // Mark row deleted or clear values
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `'${tabName}'!A${targetRowIdx}:ZZ${targetRowIdx}`,
      });

      return { success: true, deleted: true };
    });
  }

  /**
   * Full Sync: Push all in-memory ERP tables into the respective 25 Google Sheets tabs
   * Uses batchUpdate to write all worksheets in a single fast, non-throttled API round-trip.
   */
  public async syncDataToSheets(allData: Record<string, any[]>): Promise<{
    success: boolean;
    syncedCounts: Record<string, number>;
    message: string;
  }> {
    return this.queueOperation(async () => {
      const sheets = this.getSheetsClient();
      const spreadsheetId = this.spreadsheetId!;
      const syncedCounts: Record<string, number> = {};

      // Ensure sheets exist
      await this.initializeSheets();

      const dataToWrite: sheets_v4.Schema$ValueRange[] = [];
      const rangesToClear: string[] = [];

      for (const [sheetName, rows] of Object.entries(allData)) {
        if (!SHEET_SCHEMAS[sheetName]) continue;
        const headers = SHEET_SCHEMAS[sheetName];

        const rowValues = rows.map((item) =>
          headers.map((h) => {
            let val = item[h];
            if (val === undefined || val === null) return '';
            if (typeof val === 'object') return JSON.stringify(val);
            val = String(val);
            // Escape values starting with '+' (like phone numbers +233...) so Google Sheets treats them as text
            if (val.startsWith('+')) {
              val = `'${val}`;
            }
            return val;
          })
        );

        rangesToClear.push(`'${sheetName}'!A1:ZZ50000`);
        dataToWrite.push({
          range: `'${sheetName}'!A1`,
          values: [headers, ...rowValues],
        });

        syncedCounts[sheetName] = rows.length;
      }

      // 1. Batch clear existing ranges in ONE call
      if (rangesToClear.length > 0) {
        await sheets.spreadsheets.values.batchClear({
          spreadsheetId,
          requestBody: {
            ranges: rangesToClear,
          },
        });
      }

      // 2. Batch update all 25 worksheets in ONE call
      if (dataToWrite.length > 0) {
        await sheets.spreadsheets.values.batchUpdate({
          spreadsheetId,
          requestBody: {
            valueInputOption: 'USER_ENTERED',
            data: dataToWrite,
          },
        });
      }

      return {
        success: true,
        syncedCounts,
        message: `Successfully populated and synchronized all ${Object.keys(syncedCounts).length} ERP worksheets in Google Sheets.`,
      };
    });
  }

  /**
   * Controlled Test Write & Read-back on TransactionJournal or Test tab
   */
  public async performControlledTest(): Promise<{
    success: boolean;
    testId: string;
    writtenData: any;
    readBackData: any;
    durationMs: number;
    message: string;
  }> {
    const startTime = Date.now();
    const testId = `TEST-GS-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const payload = {
      id: testId,
      idempotencyKey: `IDEM-TEST-${testId}`,
      timestamp,
      type: 'HEALTHCHECK_TEST',
      amount: 1.00,
      referenceId: 'REF-TEST-001',
      status: 'Success',
      payloadJson: JSON.stringify({
        source: 'Melstar ERP Backend',
        environment: 'Google Cloud Run',
        serviceAccount: this.serviceAccountEmail,
        currency: this.currency,
        timezone: this.timezone,
      }),
    };

    // Ensure TransactionJournal sheet exists with headers
    await this.initializeSheets();

    // 1. Write
    await this.appendRecord('TransactionJournal', payload);

    // 2. Read back
    const rows = await this.readTab<any>('TransactionJournal');
    const matched = rows.find((r) => r.id === testId);

    const durationMs = Date.now() - startTime;

    if (!matched) {
      throw new Error(`Controlled test failed: written record ${testId} was not found on read-back.`);
    }

    return {
      success: true,
      testId,
      writtenData: payload,
      readBackData: matched,
      durationMs,
      message: `Controlled write and read-back succeeded in ${durationMs}ms against "TransactionJournal" tab!`,
    };
  }

  /**
   * Queue concurrent write operations safely
   */
  private queueOperation<T>(operation: () => Promise<T>): Promise<T> {
    const run = this.writeQueue.then(() => operation());
    this.writeQueue = run.catch(() => {});
    return run;
  }
}

export const googleSheetsService = new GoogleSheetsService();
