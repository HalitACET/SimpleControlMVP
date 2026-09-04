import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus } from 'lucide-react';
import FormInput from '../components/ui/form/FormInput';
import FormSelect from '../components/ui/form/FormSelect';
import Badge from '../components/ui/badge/Badge';
import ManualScanDrawer from '../components/scans/ManualScanDrawer';
import tableStyles from '../components/ui/table/Table.module.css';
import dailyStyles from './DailyReport.module.css'; // For common header/filter bars
import { useToast } from '../components/ui/toast/ToastContext';

interface RawScanRow {
  id: number;
  employeeId: number;
  employeeName: string;
  scannedAt: string;
  createdAt: string;
  method: string;
  locationName: string | null;
  suspicious: boolean;
  suspiciousReason: string | null;
  manualNote: string | null;
  createdBy: string | null;
}

const getLocalDateString = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateTime = (isoString: string) => {
  if (!isoString) return '—';
  // ISO: 2026-08-13T21:53:00
  const date = isoString.substring(0, 10).split('-'); // [YYYY, MM, DD]
  const time = isoString.substring(11, 16);
  return `${date[2]}.${date[1]}.${date[0]} ${time}`;
};

const getReasonTranslation = (reason: string | null) => {
  if (!reason) return 'Doğrulanamadı';
  switch (reason) {
    case 'MOCK_FLAG': return 'Sahte konum';
    case 'GEOFENCE_VIOLATION': return 'Bölge dışı';
    case 'IMPOSSIBLE_SPEED': return 'İmkansız hız';
    case 'FROZEN_COORDINATE': return 'Donmuş konum';
    default: return reason;
  }
};

export default function Scans() {
  const defaultEndDate = new Date();
  const defaultStartDate = new Date();
  defaultStartDate.setDate(defaultStartDate.getDate() - 7);

  const [startDate, setStartDate] = useState(getLocalDateString(defaultStartDate));
  const [endDate, setEndDate] = useState(getLocalDateString(defaultEndDate));
  const [employeeId, setEmployeeId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [suspiciousOnly, setSuspiciousOnly] = useState(false);
  
  const [departments, setDepartments] = useState<{value: string, label: string}[]>([]);
  const [employees, setEmployees] = useState<{value: string, label: string}[]>([]);
  const [data, setData] = useState<RawScanRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    // Fetch departments for filter
    api.get('/admin/departments')
      .then(res => {
        setDepartments(res.data.map((d: any) => ({
          value: d.id.toString(),
          label: d.name
        })));
      })
      .catch(() => showToast('Departman listesi alınamadı', 'error'));

    // Fetch employees for filter & drawer
    api.get('/admin/employees')
      .then(res => {
        setEmployees(res.data.map((e: any) => ({
          value: e.id.toString(),
          label: `${e.firstName} ${e.lastName} (${e.cardNo})`
        })));
      })
      .catch(() => showToast('Personel listesi alınamadı', 'error'));
  }, []);

  useEffect(() => {
    fetchData();
  }, [startDate, endDate, employeeId, departmentId, suspiciousOnly]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/admin/scans?startDate=${startDate}&endDate=${endDate}&suspiciousOnly=${suspiciousOnly}`;
      if (employeeId) url += `&employeeId=${employeeId}`;
      if (departmentId) url += `&departmentId=${departmentId}`;
      const res = await api.get(url);
      setData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Hareket kayıtları alınırken hata oluştu.');
      showToast('Kayıtlar yüklenemedi', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={dailyStyles.container}>
      <div className={dailyStyles.filterBar} style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <FormInput 
            label="Başlangıç" 
            type="date" 
            value={startDate} 
            onChange={e => setStartDate(e.target.value)} 
          />
          <FormInput 
            label="Bitiş" 
            type="date" 
            value={endDate} 
            onChange={e => setEndDate(e.target.value)} 
          />
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
              options={[{ value: '', label: 'Tüm Personel' }, ...employees]}
              value={employeeId}
              onChange={e => setEmployeeId(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', height: '38px', marginLeft: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: 'var(--font-size-body)' }}>
              <input 
                type="checkbox" 
                checked={suspiciousOnly} 
                onChange={e => setSuspiciousOnly(e.target.checked)} 
                style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
              />
              Sadece şüpheli kayıtlar
            </label>
          </div>
        </div>
        
        <button 
          className="btn btn-primary" 
          onClick={() => setIsDrawerOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Plus size={18} /> Manuel Kayıt Ekle
        </button>
      </div>

      <div className={tableStyles.card}>
        {error ? (
          <div className={tableStyles.emptyState}>{error}</div>
        ) : loading ? (
          <div className={tableStyles.emptyState}>Yükleniyor...</div>
        ) : data.length === 0 ? (
          <div className={tableStyles.emptyState}>Seçilen aralıkta kayıt yok.</div>
        ) : (
          <table className={tableStyles.table}>
            <thead className={tableStyles.thead}>
              <tr>
                <th className={tableStyles.th} style={{ width: '150px' }}>Tarih / Saat</th>
                <th className={tableStyles.th}>Personel</th>
                <th className={tableStyles.th} style={{ width: '100px' }}>Yöntem</th>
                <th className={tableStyles.th}>Lokasyon</th>
                <th className={tableStyles.th} style={{ width: '150px' }}>Durum</th>
                <th className={tableStyles.th}>Not</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} className={tableStyles.tr}>
                  <td className={tableStyles.tdMono}>{formatDateTime(row.scannedAt)}</td>
                  <td className={tableStyles.tdPrimary}>{row.employeeName}</td>
                  <td className={tableStyles.td}>
                    <Badge variant="neutral">{row.method}</Badge>
                  </td>
                  <td className={tableStyles.td}>
                    {row.locationName ? row.locationName : <span className={dailyStyles.mutedText}>—</span>}
                  </td>
                  <td className={tableStyles.td}>
                    {row.suspicious ? (
                      <Badge variant="error" title={row.suspiciousReason || 'Doğrulanamadı'}>
                        {getReasonTranslation(row.suspiciousReason)}
                      </Badge>
                    ) : (
                      <span className={dailyStyles.mutedText}>—</span>
                    )}
                  </td>
                  <td className={tableStyles.td}>
                    {row.method === 'MANUAL' && row.manualNote ? (
                      <div>
                        <div>{row.manualNote}</div>
                        {row.createdBy && (
                          <div className={dailyStyles.mutedText} style={{ fontSize: 'var(--font-size-caption)', marginTop: '2px' }}>
                            İK: {row.createdBy}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className={dailyStyles.mutedText}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ManualScanDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        onSuccess={() => {
          setIsDrawerOpen(false);
          fetchData();
        }}
        employees={employees}
      />
    </div>
  );
}
