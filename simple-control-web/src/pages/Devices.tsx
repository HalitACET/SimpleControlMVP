import { useState, useEffect } from 'react';
import api from '../api/axios';
import { handleApiError } from '../utils/errorHandler';
import Badge from '../components/ui/badge/Badge';
import tableStyles from '../components/ui/table/Table.module.css';
import dailyStyles from './DailyReport.module.css';
import { useToast } from '../components/ui/toast/ToastContext';
import { useConfirm } from '../components/ui/confirm/ConfirmDialogContext';

interface DeviceListResponse {
  id: number;
  deviceId: string;
  deviceName: string;
  registeredAt: string;
  active: boolean;
  userId: number;
  username: string;
  employeeName: string | null;
  cardNo: string | null;
}

const formatDateTime = (isoString: string) => {
  if (!isoString) return '—';
  const date = isoString.substring(0, 10).split('-'); 
  const time = isoString.substring(11, 16);
  return `${date[2]}.${date[1]}.${date[0]} ${time}`;
};

export default function Devices() {
  const [data, setData] = useState<DeviceListResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { showToast } = useToast();
  const { confirm } = useConfirm();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/devices');
      setData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Cihazlar alınırken hata oluştu.');
      showToast('Cihazlar yüklenemedi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUnbind = async (device: DeviceListResponse) => {
    const isConfirmed = await confirm({
      title: 'Cihaz eşleşmesini kaldır',
      message: `${device.employeeName || device.username} kullanıcısının cihaz eşleşmesi kaldırılacak. Personel bir sonraki girişinde yeni cihazını eşleştirebilir.`,
      confirmText: 'Onayla'
    });

    if (isConfirmed) {
      try {
        await api.post('/admin/device-unbind', { username: device.username });
        showToast('Cihaz eşleşmesi başarıyla kaldırıldı', 'success');
        fetchData();
      } catch (err: any) {
        showToast(handleApiError(err), 'error');
      }
    }
  };

  return (
    <div className={dailyStyles.container}>
      <h2 style={{ marginBottom: '1.5rem', color: 'var(--color-text-primary)' }}>Cihazlar</h2>

      <div className={tableStyles.card}>
        {error ? (
          <div className={tableStyles.emptyState}>{error}</div>
        ) : loading ? (
          <div className={tableStyles.emptyState}>Yükleniyor...</div>
        ) : data.length === 0 ? (
          <div className={tableStyles.emptyState}>Kayıtlı cihaz bulunmuyor.</div>
        ) : (
          <table className={tableStyles.table}>
            <thead className={tableStyles.thead}>
              <tr>
                <th className={tableStyles.th}>Personel</th>
                <th className={tableStyles.th}>Kart No</th>
                <th className={tableStyles.th}>Cihaz</th>
                <th className={tableStyles.th}>Cihaz ID</th>
                <th className={tableStyles.th} style={{ width: '150px' }}>Kayıt Tarihi</th>
                <th className={tableStyles.th} style={{ width: '100px' }}>Durum</th>
                <th className={tableStyles.th} style={{ width: '120px' }}>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} className={tableStyles.tr}>
                  <td className={tableStyles.tdPrimary}>{row.employeeName || row.username}</td>
                  <td className={tableStyles.td}>
                    {row.cardNo ? row.cardNo : <span className={dailyStyles.mutedText}>—</span>}
                  </td>
                  <td className={tableStyles.td}>{row.deviceName}</td>
                  <td className={tableStyles.tdMono} title={row.deviceId}>
                    {row.deviceId.length > 8 ? `${row.deviceId.substring(0, 8)}…` : row.deviceId}
                  </td>
                  <td className={tableStyles.td}>{formatDateTime(row.registeredAt)}</td>
                  <td className={tableStyles.td}>
                    {row.active ? (
                      <Badge variant="success">Aktif</Badge>
                    ) : (
                      <Badge variant="neutral">Pasif</Badge>
                    )}
                  </td>
                  <td className={tableStyles.td}>
                    <button 
                      style={{
                        background: 'transparent', border: '1px solid var(--color-border)', 
                        borderRadius: 'var(--radius-sm)', padding: '4px 8px', 
                        fontSize: 'var(--font-size-caption)', cursor: 'pointer',
                        color: 'var(--color-error)'
                      }}
                      onClick={() => handleUnbind(row)}
                    >
                      Eşleşmeyi Kaldır
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
