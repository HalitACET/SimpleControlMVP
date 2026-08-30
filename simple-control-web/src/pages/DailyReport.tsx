import { useState, useEffect } from 'react';
import api from '../api/axios';
import { ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import FormInput from '../components/ui/form/FormInput';
import FormSelect from '../components/ui/form/FormSelect';
import styles from './DailyReport.module.css';
import tableStyles from '../components/ui/table/Table.module.css';
import { useToast } from '../components/ui/toast/ToastContext';

interface DailyReportRow {
  employeeId: number;
  employeeName: string;
  cardNo: string;
  workGroupName: string;
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

export default function DailyReport() {
  const [date, setDate] = useState(getLocalDateString(new Date()));
  const [employeeId, setEmployeeId] = useState('');
  
  const [employees, setEmployees] = useState<{value: string, label: string}[]>([]);
  const [data, setData] = useState<DailyReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchData();
  }, [date, employeeId]);

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/admin/employees');
      const opts = res.data.map((e: any) => ({
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
      if (employeeId) {
        url += `&employeeId=${employeeId}`;
      }
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
      case 'NORMAL': return <span className={`${styles.badge} ${styles.badgeSuccess}`}>Normal</span>;
      case 'EKSIK_CIKIS': return <span className={`${styles.badge} ${styles.badgeWarning}`}>Eksik Çıkış</span>;
      case 'DEVAMSIZ': return <span className={`${styles.badge} ${styles.badgeError}`}>Devamsız</span>;
      case 'TATIL': return <span className={`${styles.badge} ${styles.badgeInfo}`}>Tatil</span>;
      case 'GRUP_ATANMAMIS': return <span className={styles.badge}>Grup Yok</span>;
      default: return <span className={styles.badge}>{status}</span>;
    }
  };

  // Summary calc
  const summary = {
    attended: data.filter(d => d.entryTime).length,
    late: data.filter(d => d.lateMinutes > 0).length,
    absent: data.filter(d => d.status === 'DEVAMSIZ').length,
    missingExit: data.filter(d => d.status === 'EKSIK_CIKIS').length,
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
        
        <div style={{ width: '250px' }}>
          <FormSelect
            label="Personel"
            options={employees}
            value={employeeId}
            onChange={e => setEmployeeId(e.target.value)}
          />
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
          <div className={tableStyles.emptyState}>Bu tarih için rapor verisi bulunamadı.</div>
        ) : (
          <table className={tableStyles.table}>
            <thead className={tableStyles.thead}>
              <tr>
                <th className={tableStyles.th}>Personel</th>
                <th className={tableStyles.th} style={{ width: '100px' }}>Kart No</th>
                <th className={tableStyles.th} style={{ width: '120px', textAlign: 'right' }}>Vardiya</th>
                <th className={tableStyles.th} style={{ width: '80px', textAlign: 'right' }}>Giriş</th>
                <th className={tableStyles.th} style={{ width: '80px', textAlign: 'right' }}>Çıkış</th>
                <th className={tableStyles.th} style={{ width: '100px', textAlign: 'right' }}>Çalışılan</th>
                <th className={tableStyles.th} style={{ width: '80px', textAlign: 'right' }}>Geç</th>
                <th className={tableStyles.th} style={{ width: '100px', textAlign: 'right' }}>Erken Çıkış</th>
                <th className={tableStyles.th} style={{ width: '130px' }}>Durum</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.employeeId} className={tableStyles.tr}>
                  <td className={tableStyles.tdPrimary}>
                    {row.employeeName}
                    {row.suspiciousScanCount > 0 && (
                      <span className={styles.suspiciousIcon} title={`${row.suspiciousScanCount} şüpheli okutma tespit edildi`}>
                        <AlertTriangle size={16} />
                      </span>
                    )}
                  </td>
                  <td className={tableStyles.td}>{row.cardNo}</td>
                  <td className={tableStyles.td} style={{ textAlign: 'right' }}>{row.shiftName || '—'}</td>
                  
                  <td className={tableStyles.td} style={{ textAlign: 'right' }}>
                    <div className={styles.timeCell} style={{ justifyContent: 'flex-end' }}>
                      {formatTime(row.entryTime)}
                    </div>
                  </td>
                  
                  <td className={tableStyles.td} style={{ textAlign: 'right' }}>
                    <div className={styles.timeCell} style={{ justifyContent: 'flex-end' }}>
                      {formatTime(row.exitTime)}
                      {isNextDay(row.exitTime, row.date) && <span className={tableStyles.nightBadge} title="Ertesi gün">+1</span>}
                    </div>
                  </td>
                  
                  <td className={tableStyles.td} style={{ textAlign: 'right' }}>{formatDuration(row.workedMinutes)}</td>
                  
                  <td className={tableStyles.td} style={{ textAlign: 'right' }}>
                    {row.lateMinutes > 0 
                      ? <span className={styles.warningText}>{formatDuration(row.lateMinutes)}</span> 
                      : <span className={styles.mutedText}>—</span>}
                  </td>
                  
                  <td className={tableStyles.td} style={{ textAlign: 'right' }}>
                    {row.earlyExitMinutes > 0 
                      ? <span className={styles.warningText}>{formatDuration(row.earlyExitMinutes)}</span> 
                      : <span className={styles.mutedText}>—</span>}
                  </td>
                  
                  <td className={tableStyles.td}>{getStatusBadge(row.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
