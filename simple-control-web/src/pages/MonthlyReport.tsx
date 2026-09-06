import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { ChevronLeft, ChevronRight, AlertTriangle, Users, Building2 } from 'lucide-react';
import FormInput from '../components/ui/form/FormInput';
import FormSelect from '../components/ui/form/FormSelect';
import styles from './DailyReport.module.css';
import tableStyles from '../components/ui/table/Table.module.css';
import { useToast } from '../components/ui/toast/ToastContext';

interface MonthlyReportResponse {
  employeeId: number;
  employeeName: string;
  cardNo: string;
  workGroupName: string;
  departmentId: number | null;
  departmentName: string | null;
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

interface DepartmentMonthlySummaryResponse {
  departmentId: number | null;
  departmentName: string;
  employeeCount: number;
  totalWorkedMinutes: number;
  totalLateMinutes: number;
  totalEarlyExitMinutes: number;
  totalOvertimeMinutes: number;
  totalAbsentDays: number;
  totalLateDayCount: number;
}

const getLocalMonthString = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

interface DepartmentResponse {
  id: number;
  name: string;
}

export default function MonthlyReport() {
  const [monthStr, setMonthStr] = useState(getLocalMonthString(new Date()));
  const [departmentId, setDepartmentId] = useState('');
  const [departments, setDepartments] = useState<{value: string, label: string}[]>([]);
  
  const [viewType, setViewType] = useState<'employee' | 'department'>('employee');
  const [data, setData] = useState<MonthlyReportResponse[]>([]);
  const [deptData, setDeptData] = useState<DepartmentMonthlySummaryResponse[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/admin/departments')
      .then(res => {
        setDepartments(res.data.map((d: DepartmentResponse) => ({
          value: d.id.toString(),
          label: d.name
        })));
      })
      .catch(() => showToast('Departman listesi alınamadı', 'error'));
  }, []);

  useEffect(() => {
    fetchData();
  }, [monthStr, departmentId, viewType]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [year, month] = monthStr.split('-');
      if (viewType === 'employee') {
        let url = `/admin/reports/monthly?year=${year}&month=${month}`;
        if (departmentId) url += `&departmentId=${departmentId}`;
        const res = await api.get(url);
        setData(res.data);
      } else {
        const res = await api.get(`/admin/reports/monthly/by-department?year=${year}&month=${month}`);
        setDeptData(res.data);
      }
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

  const getSummary = () => {
    if (viewType === 'employee') {
      return {
        totalEmployees: data.length,
        totalWorked: data.reduce((acc, row) => acc + row.totalWorkedMinutes, 0),
        totalAbsentDays: data.reduce((acc, row) => acc + row.absentDays, 0),
        totalLate: data.reduce((acc, row) => acc + row.totalLateMinutes, 0)
      };
    } else {
      return {
        totalEmployees: deptData.reduce((acc, row) => acc + row.employeeCount, 0),
        totalWorked: deptData.reduce((acc, row) => acc + row.totalWorkedMinutes, 0),
        totalAbsentDays: deptData.reduce((acc, row) => acc + row.totalAbsentDays, 0),
        totalLate: deptData.reduce((acc, row) => acc + row.totalLateMinutes, 0)
      };
    }
  };

  const summary = getSummary();

  return (
    <div className={styles.container}>
      <div className={styles.filterBar} style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
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
          
          {viewType === 'employee' && (
            <div style={{ minWidth: '220px' }}>
              <FormSelect
                label="Departman"
                options={[{ value: '', label: 'Tüm Departmanlar' }, ...departments]}
                value={departmentId}
                onChange={e => setDepartmentId(e.target.value)}
              />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button 
            className={`btn ${viewType === 'employee' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewType('employee')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Users size={18} />
            Personel
          </button>
          <button 
            className={`btn ${viewType === 'department' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewType('department')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Building2 size={18} />
            Departman
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
        ) : viewType === 'employee' ? (
          data.length === 0 ? (
            <div className={tableStyles.emptyState}>Bu ay için veri bulunamadı.</div>
          ) : (
            <table className={tableStyles.table}>
              <thead className={tableStyles.thead}>
                <tr>
                  <th className={tableStyles.th}>Personel</th>
                  <th className={tableStyles.th}>Departman</th>
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
                    <td className={tableStyles.td}>
                      {row.departmentName ? (
                        <span className={tableStyles.primaryText}>{row.departmentName}</span>
                      ) : (
                        <span className={tableStyles.secondaryText}>—</span>
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
          )
        ) : (
          deptData.length === 0 ? (
            <div className={tableStyles.emptyState}>Bu ay için departman verisi bulunamadı.</div>
          ) : (
            <div className={tableStyles.tableWrapper}>
            <table className={tableStyles.table}>
              <thead className={tableStyles.thead}>
                <tr>
                  <th className={tableStyles.th}>Departman</th>
                  <th className={tableStyles.th} style={{ width: '130px', textAlign: 'right' }}>Personel Sayısı</th>
                  <th className={tableStyles.th} style={{ width: '150px', textAlign: 'right' }}>Toplam Çalışma</th>
                  <th className={tableStyles.th} style={{ width: '130px', textAlign: 'right' }}>Toplam Geç</th>
                  <th className={tableStyles.th} style={{ width: '150px', textAlign: 'right' }}>Toplam Erken Çıkış</th>
                  <th className={tableStyles.th} style={{ width: '150px', textAlign: 'right' }}>Toplam Fazla Mesai</th>
                  <th className={tableStyles.th} style={{ width: '130px', textAlign: 'right' }}>Devamsız Gün</th>
                  <th className={tableStyles.th} style={{ width: '130px', textAlign: 'right' }}>Geç Kalınan Gün</th>
                </tr>
              </thead>
              <tbody>
                {deptData.map((row, idx) => {
                  const isUnassigned = row.departmentId === null;
                  const borderStyle = isUnassigned && idx > 0 ? { borderTop: '2px solid var(--border-color)' } : {};
                  return (
                    <tr 
                      key={row.departmentId ?? 'unassigned'} 
                      className={tableStyles.tr}
                      style={{ cursor: 'default', ...borderStyle }}
                    >
                      <td className={tableStyles.tdPrimary}>
                        {isUnassigned ? <span className={styles.mutedText}>{row.departmentName}</span> : row.departmentName}
                      </td>
                      <td className={tableStyles.td} style={{ textAlign: 'right' }}>{row.employeeCount}</td>
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
                      <td className={tableStyles.td} style={{ textAlign: 'right' }}>
                        {row.totalOvertimeMinutes > 0 
                          ? <span style={{ color: 'var(--color-success)', fontWeight: 500 }}>{formatDuration(row.totalOvertimeMinutes)}</span> 
                          : <span className={styles.mutedText}>—</span>}
                      </td>
                      <td className={tableStyles.td} style={{ textAlign: 'right' }}>
                        {row.totalAbsentDays > 0 
                          ? <span className={styles.warningText} style={{ color: 'var(--color-error)' }}>{row.totalAbsentDays}</span> 
                          : row.totalAbsentDays}
                      </td>
                      <td className={tableStyles.td} style={{ textAlign: 'right' }}>
                        {row.totalLateDayCount > 0 
                          ? <span className={styles.warningText}>{row.totalLateDayCount}</span> 
                          : row.totalLateDayCount}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          )
        )}
      </div>
    </div>
  );
}
