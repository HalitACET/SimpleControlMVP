export interface ScanRequest {
  scannedAt: string | null;
  latitude: number;
  longitude: number;
  qrContent: string | null;
  method: 'QR' | 'GPS';
  deviceId: string;
  mockLocation: boolean;
  clientId?: string;
}

export interface ScanResponse {
  id: number;
  scannedAt: string;
  suspicious: boolean;
  suspiciousReason: string | null;
  locationName: string | null;
}

export interface BatchScanResult {
  clientId: string;
  status: string;
  scanId: number | null;
  errorCode: string | null;
}

export interface NextActionResponse {
  suggestedType: 'GIRIS' | 'CIKIS';
  lastScan: { scannedAt: string; method: string; locationName: string | null } | null;
  todayShift: { name: string; startTime: string; endTime: string; crossesMidnight: boolean } | null;
  holiday: boolean;
  entryTime: string | null;
  exitTime: string | null;
}

export interface ScanHistoryItem {
  id: number;
  scannedAt: string;
  method: 'QR' | 'GPS';
  locationName: string | null;
  suspicious: boolean;
  excluded: boolean;
}

export interface ScanHistoryPage {
  content: ScanHistoryItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface SummaryResponse {
  year: number;
  month: number;
  expectedWorkDays: number;
  attendedDays: number;
  absentDays: number;
  totalWorkedMinutes: number;
  totalLateMinutes: number;
  totalEarlyExitMinutes: number;
  totalOvertimeMinutes: number;
  workGroupName: string | null;
}

export type DailyStatus =
  | 'NORMAL' | 'EKSIK_CIKIS' | 'DEVAMSIZ'
  | 'TATIL' | 'GRUP_ATANMAMIS' | 'GELECEK';

export interface DailyItem {
  date: string;
  dayOfWeek: number;
  status: DailyStatus;
  shiftName: string | null;
  shiftStartTime: string | null;
  shiftEndTime: string | null;
  entryTime: string | null;
  exitTime: string | null;
  workedMinutes: number | null;
  lateMinutes: number | null;
  earlyExitMinutes: number | null;
  overtimeMinutes: number | null;
  scanCount: number;
  nightShift: boolean;
}

