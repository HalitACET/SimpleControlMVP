import { useState, useEffect } from 'react';
import Badge from '../components/ui/badge/Badge';
import api from '../api/axios';
import { ChevronLeft, ChevronRight, AlertTriangle, Download } from 'lucide-react';
import FormInput from '../components/ui/form/FormInput';
import FormSelect from '../components/ui/form/FormSelect';
import styles from './DailyReport.module.css';
import tableStyles from '../components/ui/table/Table.module.css';
import { useToast } from '../components/ui/toast/ToastContext';
import {
  exportToExcel,
  cellOrBlank,
  formatDurationCell,
  formatStatusText,
  formatTimeCell,
  formatDateCell,
  formatLongDateLabel,
  formatGeneratedAt,
  getFirmCode,
  type ExcelCell
} from '../utils/excelExport';

interface DailyReportRow {
  employeeId: number;
  employeeName: string;
  cardNo: string;
  workGroupName: string;
  departmentName?: string;
  date: string;
  dayOfWeek: number;
  status: string;
  shiftName: string;
  shiftStartTime: string;
  shiftEndTime: string;
  entryTime: string;
  exitTime: string;
  workedMinutes: number;
  lateMinutes: number;
  earlyExitMinutes: number;
  totalMissingMinutes: number;
  overtimeMinutes: number;
  scanCount: number;
  suspiciousScanCount: number;
  nightShift: boolean;
}

const getLocalDateString = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface DepartmentResponse {
  id: number;
  name: string;
}

interface EmployeeResponse {
  id: number;
  firstName: string;
  lastName: string;
}

export default function DailyReport() {
  const [date, setDate] = useState(getLocalDateString(new Date()));
  const [employeeId, setEmployeeId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [departments, setDepartments] = useState<{value: string, label: string}[]>([]);
  
  const [employees, setEmployees] = useState<{value: string, label: string}[]>([]);
  const [data, setData] = useState<DailyReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchData();
  }, [date, employeeId, departmentId]);

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/admin/departments');
      setDepartments(res.data.map((d: DepartmentResponse) => ({ value: d.id.toString(), label: d.name })));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/admin/employees');
      const opts = res.data.map((e: EmployeeResponse) => ({
        value: e.id.toString(),
        label: `${e.firstName} ${e.lastName}`
      }));
      setEmployees([{value: '', label: 'Tüm Personel'}, ...opts]);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Personel listesi alınamadı', 'error');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/admin/reports/daily?date=${date}`;
      if (employeeId) url += `&employeeId=${employeeId}`;
      if (departmentId) url += `&departmentId=${departmentId}`;
      
      const res = await api.get(url);
      setData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Rapor verisi alınırken bir hata oluştu.');
      showToast('Rapor yüklenemedi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePrevDay = () => {
    setDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 1);
      return getLocalDateString(d);
    });
  };

  const handleNextDay = () => {
    setDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 1);
      return getLocalDateString(d);
    });
  };

  const formatTime = (isoString: string) => {
    if (!isoString) return '—';
    return isoString.substring(11, 16);
  };

  const isNextDay = (isoString: string, reportDate: string) => {
    if (!isoString) return false;
    const datePart = isoString.substring(0, 10);
    return datePart !== reportDate;
  };

  const formatDuration = (minutes: number) => {
    if (!minutes || minutes <= 0) return '—';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}dk`;
    if (m === 0) return `${h}s`;
    return `${h}s ${m}dk`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NORMAL': return <Badge variant="success">Normal</Badge>;
      case 'EKSIK_CIKIS': return <Badge variant="warning">Eksik Çıkış</Badge>;
      case 'DEVAMSIZ': return <Badge variant="error">Devamsız</Badge>;
      case 'TATIL': return <Badge variant="info">Tatil</Badge>;
      case 'GRUP_ATANMAMIS': return <Badge variant="neutral">Grup Yok</Badge>;
      case 'GELECEK': return <Badge variant="neutral">—</Badge>;
      default: return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const summary = {
    attended: data.filter(d => d.entryTime).length,
    late: data.filter(d => d.lateMinutes > 0).length,
    absent: data.filter(d => d.status === 'DEVAMSIZ').length,
    missingExit: data.filter(d => d.status === 'EKSIK_CIKIS').length,
  };

  const handleExport = () => {
    const selectedDept = departments.find(d => d.value === departmentId);
    const selectedEmp = employees.find(e => e.value === employeeId);

    const meta = [
      `Firma: ${getFirmCode()}`,
      `Tarih: ${formatLongDateLabel(date)}`
    ];
    if (selectedDept) meta.push(`Departman: ${selectedDept.label}`);
    if (selectedEmp && employeeId) meta.push(`Personel: ${selectedEmp.label}`);
    meta.push(`Oluşturma Tarihi: ${formatGeneratedAt()}`);

    const rows: ExcelCell[][] = data.map(row => [
      row.employeeName,
      cellOrBlank(row.cardNo),
      cellOrBlank(row.departmentName),
      cellOrBlank(row.workGroupName),
      cellOrBlank(row.shiftName),
      formatTimeCell(row.entryTime),
      formatTimeCell(row.exitTime),
      formatDurationCell(row.workedMinutes),
      row.workedMinutes,
      row.lateMinutes,
      row.earlyExitMinutes,
      formatStatusText(row.status)
    ]);

    try {
      exportToExcel({
        fileName: `gunluk-rapor-${date}.xlsx`,
        sheetName: String(formatDateCell(date) ?? date),
        title: 'GÜNLÜK DEVAM RAPORU',
        meta,
        columns: [
          { header: 'Personel', width: 24 },
          { header: 'Kart No', width: 12 },
          { header: 'Departman', width: 18 },
          { header: 'Çalışma Grubu', width: 18 },
          { header: 'Vardiya', width: 16 },
          { header: 'Giriş', width: 10 },
          { header: 'Çıkış', width: 10 },
          { header: 'Çalışılan Süre', width: 15 },
          { header: 'Çalışılan (dk)', width: 14 },
          { header: 'Geç (dk)', width: 10 },
          { header: 'Erken Çıkış (dk)', width: 16 },
          { header: 'Durum', width: 14 }
        ],
        rows
      });
      showToast('Excel dosyası indirildi', 'success');
    } catch {
      showToast('Excel dosyası oluşturulamadı', 'error');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.filterBar}>
        <div className={styles.dateControl}>
          <button className={styles.iconButton} onClick={handlePrevDay} title="Önceki Gün">
            <ChevronLeft size={18} />
          </button>
          <FormInput 
            label="Tarih" 
            type="date" 
            value={date} 
            onChange={e => setDate(e.target.value)} 
            required
          />
          <button className={styles.iconButton} onClick={handleNextDay} title="Sonraki Gün">
            <ChevronRight size={18} />
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ minWidth: '220px' }}>
            <FormSelect
              label="Departman"
              options={[{ value: '', label: 'Tüm Departmanlar' }, ...departments]}
              value={departmentId}
              onChange={e => setDepartmentId(e.target.value)}
            />
          </div>
          <div style={{ minWidth: '220px' }}>
            <FormSelect
              label="Personel"
              options={employees}
              value={employeeId}
              onChange={e => setEmployeeId(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.filterActions}>
          <button
            className={styles.btnOutline}
            onClick={handleExport}
            disabled={data.length === 0 || loading}
          >
            <Download size={16} /> Excel'e Aktar
          </button>
        </div>
      </div>

      <div className={styles.summaryBar}>
        <div className={`${styles.summaryCard} ${styles.success}`}>
          <span className={styles.summaryLabel}>Gelen Personel</span>
          <span className={styles.summaryValue}>{summary.attended}</span>
        </div>
        <div className={`${styles.summaryCard} ${styles.warning}`}>
          <span className={styles.summaryLabel}>Geç Kalan</span>
          <span className={styles.summaryValue}>{summary.late}</span>
        </div>
        <div className={`${styles.summaryCard} ${styles.error}`}>
          <span className={styles.summaryLabel}>Devamsız</span>
          <span className={styles.summaryValue}>{summary.absent}</span>
        </div>
        <div className={`${styles.summaryCard} ${styles.warning}`}>
          <span className={styles.summaryLabel}>Eksik Çıkış</span>
          <span className={styles.summaryValue}>{summary.missingExit}</span>
        </div>
      </div>

      <div className={tableStyles.card}>
        {error ? (
          <div className={tableStyles.emptyState}>{error}</div>
        ) : loading ? (
          <div className={tableStyles.emptyState}>Yükleniyor...</div>
        ) : data.length === 0 ? (
          <div className={tableStyles.emptyState}>Bu tarih için rapor bulunamadı.</div>
        ) : (
          <div className={tableStyles.tableWrapper}>
            <table className={tableStyles.table}>
              <thead className={tableStyles.thead}>
                <tr>
                  <th className={tableStyles.th}>Personel</th>
                  <th className={tableStyles.th}>Departman</th>
                  <th className={tableStyles.th} style={{ width: '100px' }}>Kart No</th>
                  <th className={tableStyles.th}>Çalışma Grubu</th>
                  <th className={tableStyles.th} style={{ width: '100px' }}>Durum</th>
                  <th className={tableStyles.th} style={{ width: '100px' }}>Vardiya</th>
                  <th className={tableStyles.th} style={{ width: '100px', textAlign: 'center' }}>Giriş</th>
                  <th className={tableStyles.th} style={{ width: '100px', textAlign: 'center' }}>Çıkış</th>
                  <th className={tableStyles.th} style={{ width: '100px', textAlign: 'right' }}>Çalışma</th>
                  <th className={tableStyles.th} style={{ width: '100px', textAlign: 'right' }}>Geç (dk)</th>
                  <th className={tableStyles.th} style={{ width: '100px', textAlign: 'right' }}>Erken Çıkış (dk)</th>
                  <th className={tableStyles.th} style={{ width: '100px', textAlign: 'right' }}>Fazla Mesai (dk)</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.employeeId} className={tableStyles.tr}>
                    <td className={tableStyles.td}>
                      <div className={tableStyles.cellContent}>
                        <span className={tableStyles.primaryText}>{row.employeeName}</span>
                      </div>
                    </td>
                    <td className={tableStyles.td}>
                      <div className={tableStyles.cellContent}>
                        {row.departmentName ? (
                          <span className={tableStyles.primaryText}>{row.departmentName}</span>
                        ) : (
                          <span className={tableStyles.secondaryText}>—</span>
                        )}
                      </div>
                    </td>
                    <td className={tableStyles.td}>
                      <span className={tableStyles.secondaryText}>{row.cardNo}</span>
                    </td>
                    <td className={tableStyles.td}>
                      <span className={tableStyles.secondaryText}>{row.workGroupName || '—'}</span>
                    </td>
                    <td className={tableStyles.td}>{getStatusBadge(row.status)}</td>
                    <td className={tableStyles.td}>
                      {row.shiftName ? (
                        <div className={tableStyles.cellContent}>
                          <span className={tableStyles.primaryText}>{row.shiftName}</span>
                          <span className={tableStyles.secondaryText}>
                            {formatTime(row.shiftStartTime)} - {formatTime(row.shiftEndTime)}
                            {row.nightShift && ' (Gece)'}
                          </span>
                        </div>
                      ) : (
                        <span className={tableStyles.secondaryText}>—</span>
                      )}
                    </td>
                    <td className={tableStyles.td} style={{ textAlign: 'center' }}>
                      <span className={tableStyles.primaryText}>{formatTime(row.entryTime)}</span>
                      {row.suspiciousScanCount > 0 && row.entryTime && (
                        <span title="Şüpheli okutma tespit edildi" style={{ display: 'inline', marginLeft: '4px' }}>
                          <AlertTriangle size={14} className="text-warning" />
                        </span>
                      )}
                    </td>
                    <td className={tableStyles.td} style={{ textAlign: 'center' }}>
                      <span className={tableStyles.primaryText}>{formatTime(row.exitTime)}</span>
                      {isNextDay(row.exitTime, date) && (
                        <span className={tableStyles.secondaryText} style={{ display: 'block', fontSize: '0.75rem' }}>Ertesi gün</span>
                      )}
                    </td>
                    <td className={tableStyles.td} style={{ textAlign: 'right' }}>
                      <span className={tableStyles.primaryText}>{formatDuration(row.workedMinutes)}</span>
                    </td>
                    <td className={tableStyles.td} style={{ textAlign: 'right' }}>
                      <span className={row.lateMinutes > 0 ? 'text-warning font-medium' : tableStyles.secondaryText}>
                        {row.lateMinutes > 0 ? `${row.lateMinutes}dk` : '—'}
                      </span>
                    </td>
                    <td className={tableStyles.td} style={{ textAlign: 'right' }}>
                      <span className={row.earlyExitMinutes > 0 ? 'text-warning font-medium' : tableStyles.secondaryText}>
                        {row.earlyExitMinutes > 0 ? `${row.earlyExitMinutes}dk` : '—'}
                      </span>
                    </td>
                    <td className={tableStyles.td} style={{ textAlign: 'right' }}>
                      <span className={row.overtimeMinutes > 0 ? 'text-success font-medium' : tableStyles.secondaryText}>
                        {row.overtimeMinutes > 0 ? formatDuration(row.overtimeMinutes) : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
