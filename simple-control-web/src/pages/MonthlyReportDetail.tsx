import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import FormInput from '../components/ui/form/FormInput';
import Badge from '../components/ui/badge/Badge';
import styles from './DailyReport.module.css'; // Reuse CSS
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

const getDayName = (dateStr: string) => {
  const date = new Date(dateStr);
  const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  return days[date.getDay()];
};

export default function MonthlyReportDetail() {
  const { employeeId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const yearParam = searchParams.get('year');
  const monthParam = searchParams.get('month');

  // Default to current month if missing
  const d = new Date();
  const defaultYear = d.getFullYear().toString();
  const defaultMonth = String(d.getMonth() + 1).padStart(2, '0');

  const [monthStr, setMonthStr] = useState(`${yearParam || defaultYear}-${(monthParam || defaultMonth).padStart(2, '0')}`);
  const [data, setData] = useState<DailyReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [monthStr, employeeId]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [year, month] = monthStr.split('-');
      const res = await api.get(`/admin/reports/monthly/detail?year=${year}&month=${month}&employeeId=${employeeId}`);
      setData(res.data);
      // update search params in URL so reload works identically
      setSearchParams({ year, month });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Detaylar alınırken hata oluştu.');
      showToast('Rapor yüklenemedi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const totals = {
    worked: data.reduce((acc, row) => acc + row.workedMinutes, 0),
    late: data.reduce((acc, row) => acc + row.lateMinutes, 0),
    early: data.reduce((acc, row) => acc + row.earlyExitMinutes, 0),
    overtime: data.reduce((acc, row) => acc + row.overtimeMinutes, 0)
  };

  // We can extract employee details from the first row of data
  // Even if data is empty, we don't have it, but usually a month has 30/31 days and the endpoint returns them
  const employeeInfo = data.length > 0 ? {
    name: data[0].employeeName,
    cardNo: data[0].cardNo,
    workGroup: data[0].workGroupName || 'Grup Yok'
  } : null;

  return (
    <div className={styles.container}>
      <div className={styles.filterBar} style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => navigate('/reports/monthly')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
          >
            <ArrowLeft size={16} /> Listeye Dön
          </button>
          
          {employeeInfo && (
            <div style={{ borderLeft: '1px solid var(--color-border)', paddingLeft: '1rem' }}>
              <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{employeeInfo.name}</div>
              <div className={styles.mutedText} style={{ fontSize: '0.85rem' }}>
                Kart No: {employeeInfo.cardNo} | {employeeInfo.workGroup}
              </div>
            </div>
          )}
        </div>

        <div className={styles.dateControl}>
          <FormInput 
            label="Ay / Yıl" 
            type="month" 
            value={monthStr} 
            onChange={e => setMonthStr(e.target.value)} 
            required
          />
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
                <th className={tableStyles.th} style={{ width: '120px' }}>Tarih</th>
                <th className={tableStyles.th} style={{ width: '100px' }}>Gün</th>
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
              {data.map((row) => {
                const isWeekendOrHoliday = row.dayOfWeek === 6 || row.dayOfWeek === 7 || row.status === 'TATIL';
                const isFuture = row.status === 'GELECEK';
                
                return (
                  <tr 
                    key={row.date} 
                    className={tableStyles.tr}
                    style={{
                      ...(isWeekendOrHoliday ? { backgroundColor: 'var(--color-surface-sunken)' } : {}),
                      ...(isFuture ? { opacity: 0.5 } : {})
                    }}
                  >
                    <td className={tableStyles.tdPrimary}>{row.date}</td>
                    <td className={tableStyles.td}>{getDayName(row.date)}</td>
                    <td className={tableStyles.td} style={{ textAlign: 'right' }}>{row.shiftName || '—'}</td>
                    
                    <td className={tableStyles.td} style={{ textAlign: 'right' }}>
                      <div className={styles.timeCell} style={{ justifyContent: 'flex-end' }}>
                        {formatTime(row.entryTime)}
                        {row.suspiciousScanCount > 0 && (
                          <span className={styles.suspiciousIcon} title={`${row.suspiciousScanCount} şüpheli okutma`}>
                            <AlertTriangle size={14} />
                          </span>
                        )}
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
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid var(--color-border)', backgroundColor: 'var(--color-surface)', fontWeight: 600 }}>
                <td className={tableStyles.tdPrimary} colSpan={5} style={{ textAlign: 'right', height: '48px' }}>
                  AYLIK TOPLAM
                </td>
                <td className={tableStyles.tdPrimary} style={{ textAlign: 'right' }}>
                  {formatDuration(totals.worked)}
                </td>
                <td className={tableStyles.tdPrimary} style={{ textAlign: 'right' }}>
                  {formatDuration(totals.late)}
                </td>
                <td className={tableStyles.tdPrimary} style={{ textAlign: 'right' }}>
                  {formatDuration(totals.early)}
                </td>
                <td className={tableStyles.tdPrimary} style={{ textAlign: 'left', paddingLeft: 'var(--space-lg)' }}>
                  (F. Mesai: {formatDuration(totals.overtime)})
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}
