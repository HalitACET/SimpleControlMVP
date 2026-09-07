import * as XLSX from 'xlsx';

/** Bos birakilacak hucreler icin undefined kullanilir — SheetJS undefined'i hic hucre uretmeden atlar. */
export type ExcelCell = string | number | undefined;

export interface ExcelColumn {
  header: string;
  width: number;
}

export interface ExcelExportOptions {
  fileName: string;
  sheetName: string;
  title: string;
  meta: string[];
  columns: ExcelColumn[];
  rows: ExcelCell[][];
}

const TR_MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

const TR_DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

/** Bos deger yerine bos hucre; metin filtreleri bozulmasin diye "—" yazilmaz. */
export const cellOrBlank = (value: string | number | null | undefined): ExcelCell => {
  if (value === null || value === undefined || value === '') return undefined;
  return value;
};

/** 495 -> "8s 15dk", 20 -> "20dk", 480 -> "8s", 0 -> bos hucre */
export const formatDurationCell = (minutes: number | null | undefined): ExcelCell => {
  if (!minutes || minutes <= 0) return undefined;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}dk`;
  if (mins === 0) return `${hours}s`;
  return `${hours}s ${mins}dk`;
};

export const formatStatusText = (status: string | null | undefined): ExcelCell => {
  switch (status) {
    case 'NORMAL': return 'Normal';
    case 'EKSIK_CIKIS': return 'Eksik Çıkış';
    case 'DEVAMSIZ': return 'Devamsız';
    case 'TATIL': return 'Tatil';
    case 'GRUP_ATANMAMIS': return 'Grup Atanmamış';
    case 'GELECEK': return 'Gelecek';
    default: return cellOrBlank(status);
  }
};

/** "2026-09-04" veya "2026-09-04T08:15:00" -> "04.09.2026" */
export const formatDateCell = (isoString: string | null | undefined): ExcelCell => {
  if (!isoString) return undefined;
  const [year, month, day] = isoString.substring(0, 10).split('-');
  if (!year || !month || !day) return undefined;
  return `${day}.${month}.${year}`;
};

/** "2026-09-04T08:15:00" -> "08:15" */
export const formatTimeCell = (isoString: string | null | undefined): ExcelCell => {
  if (!isoString || isoString.length < 16) return undefined;
  return isoString.substring(11, 16);
};

/** (2026, 9) -> "Eylül 2026" */
export const formatMonthLabel = (year: number, month: number) => `${TR_MONTHS[month - 1]} ${year}`;

/** "2026-09-04" -> "04 Eylül 2026 Cuma" — yerel saatle kurulur, UTC donusumu yok */
export const formatLongDateLabel = (dateStr: string) => {
  const [year, month, day] = dateStr.substring(0, 10).split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return `${String(day).padStart(2, '0')} ${TR_MONTHS[month - 1]} ${year} ${TR_DAYS[date.getDay()]}`;
};

/** Raporun uretildigi an: "08.09.2026 14:32" */
export const formatGeneratedAt = () => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

export const getFirmCode = () => import.meta.env.VITE_FIRM_ID || 'SIMPLE_CONTROL';

/** Excel sayfa adi 31 karakteri gecemez ve bazi karakterleri kabul etmez. */
const safeSheetName = (name: string) => name.replace(/[[\]:*?/\\]/g, ' ').substring(0, 31);

/**
 * Baslik + meta + bos satir + sutun basliklari + veriler duzeninde bir xlsx uretip indirir.
 */
export function exportToExcel({ fileName, sheetName, title, meta, columns, rows }: ExcelExportOptions) {
  const aoa: ExcelCell[][] = [
    [title],
    ...meta.map(line => [line]),
    [],
    columns.map(col => col.header),
    ...rows
  ];

  const sheet = XLSX.utils.aoa_to_sheet(aoa);
  sheet['!cols'] = columns.map(col => ({ wch: col.width }));

  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, safeSheetName(sheetName));
  XLSX.writeFile(book, fileName);
}
