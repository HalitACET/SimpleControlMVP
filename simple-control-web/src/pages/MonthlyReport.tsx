import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import FormInput from '../components/ui/form/FormInput';
import styles from './DailyReport.module.css'; // We can reuse the same layout classes
import tableStyles from '../components/ui/table/Table.module.css';
import { useToast } from '../components/ui/toast/ToastContext';

interface MonthlyReportResponse {
  employeeId: number;
  employeeName: string;
  cardNo: string;
  workGroupName: string;
  expectedWorkDays: number;
  attendedDays: number;
  holidayWorkDays: number;
  absentDays: number;
  missingExitDays: number;
  totalWorkedMinutes: number;
  totalLateMinutes: number;
  totalEarlyExitMinutes: number;
  totalMissingMinutes: number;
  totalOvertimeMinutes: number;
  lateDayCount: number;
  suspiciousScanCount: number;
}

const getLocalMonthString = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export default function MonthlyReport() {
  const [monthStr, setMonthStr] = useState(getLocalMonthString(new Date()));
  const [data, setData] = useState<MonthlyReportResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [monthStr]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [year, month] = monthStr.split('-');
      const res = await api.get(`/admin/reports/monthly?year=${year}&month=${month}`);
      setData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Aylık rapor alınırken hata oluştu.');
      showToast('Rapor yüklenemedi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setMonthStr(prev => {
      const [y, m] = prev.split('-').map(Number);
      const d = new Date(y, m - 1 - 1, 1);
      return getLocalMonthString(d);
    });
  };

  const handleNextMonth = () => {
    setMonthStr(prev => {
      const [y, m] = prev.split('-').map(Number);
      const d = new Date(y, m - 1 + 1, 1);
      return getLocalMonthString(d);
    });
  };

  const formatDuration = (minutes: number) => {
    if (!minutes || minutes <= 0) return '—';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}dk`;
    if (m === 0) return `${h}s`;
    return `${h}s ${m}dk`;
  };

  const summary = {
    totalEmployees: data.length,
    totalWorked: data.reduce((acc, row) => acc + row.totalWorkedMinutes, 0),
    totalAbsentDays: data.reduce((acc, row) => acc + row.absentDays, 0),
    totalLate: data.reduce((acc, row) => acc + row.totalLateMinutes, 0)
  };

  return (
    <div className={styles.container}>
      <div className={styles.filterBar}>
        <div className={styles.dateControl}>
          <button className={styles.iconButton} onClick={handlePrevMonth} title="Önceki Ay">
            <ChevronLeft size={18} />
          </button>
          <FormInput 
            label="Ay / Yıl" 
            type="month" 
            value={monthStr} 
            onChange={e => setMonthStr(e.target.value)} 
            required
          />
          <button className={styles.iconButton} onClick={handleNextMonth} title="Sonraki Ay">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className={styles.summaryBar}>
        <div className={`${styles.summaryCard} ${styles.info}`}>
          <span className={styles.summaryLabel}>Toplam Personel</span>
          <span className={styles.summaryValue}>{summary.totalEmployees}</span>
        </div>
        <div className={`${styles.summaryCard} ${styles.success}`}>
          <span className={styles.summaryLabel}>Toplam Çalışma</span>
          <span className={styles.summaryValue}>{formatDuration(summary.totalWorked) !== '—' ? formatDuration(summary.totalWorked) : '0s'}</span>
        </div>
        <div className={`${styles.summaryCard} ${styles.error}`}>
          <span className={styles.summaryLabel}>Toplam Devamsız Gün</span>
          <span className={styles.summaryValue}>{summary.totalAbsentDays}</span>
        </div>
        <div className={`${styles.summaryCard} ${styles.warning}`}>
          <span className={styles.summaryLabel}>Toplam Geç Kalma</span>
          <span className={styles.summaryValue}>{formatDuration(summary.totalLate) !== '—' ? formatDuration(summary.totalLate) : '0s'}</span>
        </div>
      </div>

      <div className={tableStyles.card}>
        {error ? (
          <div className={tableStyles.emptyState}>{error}</div>
        ) : loading ? (
          <div className={tableStyles.emptyState}>Yükleniyor...</div>
        ) : data.length === 0 ? (
          <div className={tableStyles.emptyState}>Bu ay için veri bulunamadı.</div>
        ) : (
          <table className={tableStyles.table}>
            <thead className={tableStyles.thead}>
              <tr>
                <th className={tableStyles.th}>Personel</th>
                <th className={tableStyles.th} style={{ width: '100px' }}>Kart No</th>
                <th className={tableStyles.th}>Çalışma Grubu</th>
                <th className={tableStyles.th} style={{ width: '110px', textAlign: 'right' }} title="Çalışma grubuna göre mesai beklenen gün sayısı. Tatiller ve haftalık izin günleri hariçtir.">Beklenen Gün</th>
                <th className={tableStyles.th} style={{ width: '100px', textAlign: 'right' }} title="En az bir okutma yapılan gün sayısı. Tatil günlerinde yapılan mesai de buraya dahildir.">Gelen Gün</th>
                <th className={tableStyles.th} style={{ width: '120px', textAlign: 'right' }}>Tatil Mesaisi</th>
                <th className={tableStyles.th} style={{ width: '100px', textAlign: 'right' }}>Devamsız</th>
                <th className={tableStyles.th} style={{ width: '100px', textAlign: 'right' }}>Eksik Çıkış</th>
                <th className={tableStyles.th} style={{ width: '130px', textAlign: 'right' }}>Top. Çalışma</th>
                <th className={tableStyles.th} style={{ width: '100px', textAlign: 'right' }}>Geç</th>
                <th className={tableStyles.th} style={{ width: '100px', textAlign: 'right' }}>Erken Çıkış</th>
                <th className={tableStyles.th} style={{ width: '100px', textAlign: 'right' }}>Fazla Mesai</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr 
                  key={row.employeeId} 
                  className={tableStyles.tr}
                  onClick={() => navigate(`/reports/monthly/${row.employeeId}?year=${monthStr.split('-')[0]}&month=${monthStr.split('-')[1]}`)}
                >
                  <td className={tableStyles.tdPrimary}>
                    {row.employeeName}
                    {row.suspiciousScanCount > 0 && (
                      <span className={styles.suspiciousIcon} title={`${row.suspiciousScanCount} şüpheli okutma tespit edildi`}>
                        <AlertTriangle size={16} />
                      </span>
                    )}
                  </td>
                  <td className={tableStyles.td}>{row.cardNo}</td>
                  <td className={tableStyles.td}>{row.workGroupName || '—'}</td>
                  
                  <td className={tableStyles.td} style={{ textAlign: 'right' }}>{row.expectedWorkDays}</td>
                  <td className={tableStyles.td} style={{ textAlign: 'right' }}>{row.attendedDays}</td>
                  
                  <td className={tableStyles.td} style={{ textAlign: 'right' }}>
                    {row.holidayWorkDays > 0 
                      ? <span style={{ color: 'var(--color-info)', fontWeight: 600 }}>{row.holidayWorkDays}</span> 
                      : <span className={styles.mutedText}>—</span>}
                  </td>

                  <td className={tableStyles.td} style={{ textAlign: 'right' }}>
                    {row.absentDays > 0 ? <span className={styles.warningText} style={{ color: 'var(--color-error)' }}>{row.absentDays}</span> : row.absentDays}
                  </td>
                  
                  <td className={tableStyles.td} style={{ textAlign: 'right' }}>{row.missingExitDays}</td>
                  
                  <td className={tableStyles.td} style={{ textAlign: 'right' }}>{formatDuration(row.totalWorkedMinutes)}</td>
                  
                  <td className={tableStyles.td} style={{ textAlign: 'right' }}>
                    {row.totalLateMinutes > 0 
                      ? <span className={styles.warningText}>{formatDuration(row.totalLateMinutes)}</span> 
                      : <span className={styles.mutedText}>—</span>}
                  </td>
                  
                  <td className={tableStyles.td} style={{ textAlign: 'right' }}>
                    {row.totalEarlyExitMinutes > 0 
                      ? <span className={styles.warningText}>{formatDuration(row.totalEarlyExitMinutes)}</span> 
                      : <span className={styles.mutedText}>—</span>}
                  </td>
                  
                  <td className={tableStyles.td} style={{ textAlign: 'right' }}>{formatDuration(row.totalOvertimeMinutes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
