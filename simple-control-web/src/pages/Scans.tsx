import { useState, useEffect } from 'react';
import api from '../api/axios';
import { handleApiError } from '../utils/errorHandler';
import { Plus, Download } from 'lucide-react';
import FormInput from '../components/ui/form/FormInput';
import FormSelect from '../components/ui/form/FormSelect';
import Badge from '../components/ui/badge/Badge';
import ManualScanDrawer from '../components/scans/ManualScanDrawer';
import tableStyles from '../components/ui/table/Table.module.css';
import dailyStyles from './DailyReport.module.css'; // For common header/filter bars
import { useToast } from '../components/ui/toast/ToastContext';
import { useConfirm } from '../components/ui/confirm/ConfirmDialogContext';
import ExcludeScanModal from '../components/scans/ExcludeScanModal';
import {
  exportToExcel,
  cellOrBlank,
  formatDateCell,
  formatTimeCell,
  formatGeneratedAt,
  getFirmCode,
  type ExcelCell
} from '../utils/excelExport';

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
  excluded: boolean;
  excludedReason: string | null;
  excludedBy: string | null;
  excludedAt: string | null;
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

interface DepartmentResponse {
  id: number;
  name: string;
}

interface EmployeeResponse {
  id: number;
  firstName: string;
  lastName: string;
  cardNo: string;
}

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
  const [scanToExclude, setScanToExclude] = useState<RawScanRow | null>(null);

  const { showToast } = useToast();
  const { confirm } = useConfirm();

  useEffect(() => {
    // Fetch departments for filter
    api.get('/admin/departments')
      .then(res => {
        setDepartments(res.data.map((d: DepartmentResponse) => ({
          value: d.id.toString(),
          label: d.name
        })));
      })
      .catch(() => showToast('Departman listesi alınamadı', 'error'));

    // Fetch employees for filter & drawer
    api.get('/admin/employees')
      .then(res => {
        setEmployees(res.data.map((e: EmployeeResponse) => ({
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

  const handleInclude = async (scan: RawScanRow) => {
    const isConfirmed = await confirm({
      title: 'İptali Geri Al',
      message: 'Bu kaydın iptali geri alınacak. Kayıt yeniden hesaplamalara dahil edilecek.',
      confirmText: 'Geri Al'
    });

    if (isConfirmed) {
      try {
        await api.put(`/admin/scans/${scan.id}/include`);
        showToast('İptal işlemi geri alındı', 'success');
        fetchData();
      } catch (err: any) {
        showToast(handleApiError(err), 'error');
      }
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'QR': return 'QR';
      case 'GPS': return 'GPS';
      case 'MANUAL': return 'Manuel Kayıt';
      default: return method;
    }
  };

  const getScanStatusText = (row: RawScanRow): ExcelCell => {
    const parts: string[] = [];
    if (row.excluded) parts.push('İptal Edildi');
    if (row.suspicious) parts.push(getReasonTranslation(row.suspiciousReason));
    return parts.length > 0 ? parts.join(' · ') : undefined;
  };

  // Kart no listede yok; personel filtresi secenekleri "Ad Soyad (KartNo)" biciminde geldigi icin oradan okunur
  const getCardNo = (employeeId: number): ExcelCell => {
    const option = employees.find(e => e.value === employeeId.toString());
    const match = option?.label.match(/\(([^)]+)\)\s*$/);
    return match ? match[1] : undefined;
  };

  const handleExport = () => {
    const selectedDept = departments.find(d => d.value === departmentId);
    const selectedEmp = employees.find(e => e.value === employeeId);

    const meta = [
      `Firma: ${getFirmCode()}`,
      `Tarih Aralığı: ${formatDateCell(startDate)} - ${formatDateCell(endDate)}`
    ];
    if (selectedDept) meta.push(`Departman: ${selectedDept.label}`);
    if (selectedEmp && employeeId) meta.push(`Personel: ${selectedEmp.label}`);
    if (suspiciousOnly) meta.push('Filtre: Sadece şüpheli kayıtlar');
    meta.push(`Oluşturma Tarihi: ${formatGeneratedAt()}`);

    const rows: ExcelCell[][] = data.map(row => [
      formatDateCell(row.scannedAt),
      formatTimeCell(row.scannedAt),
      row.employeeName,
      getCardNo(row.employeeId),
      getMethodLabel(row.method),
      cellOrBlank(row.locationName),
      getScanStatusText(row),
      cellOrBlank(row.excludedReason),
      cellOrBlank(row.manualNote)
    ]);

    try {
      exportToExcel({
        fileName: `hareket-kayitlari-${startDate}_${endDate}.xlsx`,
        sheetName: 'Hareket Kayıtları',
        title: 'HAREKET KAYITLARI',
        meta,
        columns: [
          { header: 'Tarih', width: 12 },
          { header: 'Saat', width: 8 },
          { header: 'Personel', width: 24 },
          { header: 'Kart No', width: 12 },
          { header: 'Yöntem', width: 14 },
          { header: 'Lokasyon', width: 20 },
          { header: 'Durum', width: 22 },
          { header: 'İptal Sebebi', width: 24 },
          { header: 'Not', width: 30 }
        ],
        rows
      });
      showToast('Excel dosyası indirildi', 'success');
    } catch {
      showToast('Excel dosyası oluşturulamadı', 'error');
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
        
        <div className={dailyStyles.filterActions}>
          <button
            className={dailyStyles.btnOutline}
            onClick={handleExport}
            disabled={data.length === 0 || loading}
          >
            <Download size={16} /> Excel'e Aktar
          </button>

          <button
            className={dailyStyles.btnNew}
            onClick={() => setIsDrawerOpen(true)}
          >
            <Plus size={18} /> Manuel Kayıt Ekle
          </button>
        </div>
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
                <th className={tableStyles.th} style={{ width: '100px' }}>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} className={tableStyles.tr} style={{ opacity: row.excluded ? 0.6 : 1 }}>
                  <td className={tableStyles.tdMono}>{formatDateTime(row.scannedAt)}</td>
                  <td className={tableStyles.tdPrimary}>{row.employeeName}</td>
                  <td className={tableStyles.td}>
                    <Badge variant="neutral">{row.method}</Badge>
                  </td>
                  <td className={tableStyles.td}>
                    {row.locationName ? row.locationName : <span className={dailyStyles.mutedText}>—</span>}
                  </td>
                  <td className={tableStyles.td}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                      {row.excluded && (
                        <Badge variant="neutral" title={row.excludedReason || 'İptal edildi'}>
                          İPTAL
                        </Badge>
                      )}
                      {row.suspicious && (
                        <Badge variant="error" title={row.suspiciousReason || 'Doğrulanamadı'}>
                          {getReasonTranslation(row.suspiciousReason)}
                        </Badge>
                      )}
                      {!row.excluded && !row.suspicious && (
                        <span className={dailyStyles.mutedText}>—</span>
                      )}
                    </div>
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
                  <td className={tableStyles.td}>
                    {row.excluded ? (
                      <button 
                        style={{
                          background: 'transparent', border: '1px solid var(--color-border)', 
                          borderRadius: 'var(--radius-sm)', padding: '4px 8px', 
                          fontSize: 'var(--font-size-caption)', cursor: 'pointer',
                          color: 'var(--color-text-primary)'
                        }}
                        onClick={() => handleInclude(row)}
                      >
                        Geri Al
                      </button>
                    ) : (
                      <button 
                        style={{
                          background: 'transparent', border: '1px solid var(--color-border)', 
                          borderRadius: 'var(--radius-sm)', padding: '4px 8px', 
                          fontSize: 'var(--font-size-caption)', cursor: 'pointer',
                          color: 'var(--color-error)'
                        }}
                        onClick={() => setScanToExclude(row)}
                      >
                        İptal Et
                      </button>
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

      <ExcludeScanModal
        isOpen={!!scanToExclude}
        onClose={() => setScanToExclude(null)}
        onSuccess={() => {
          setScanToExclude(null);
          fetchData();
        }}
        scan={scanToExclude}
      />
    </div>
  );
}
