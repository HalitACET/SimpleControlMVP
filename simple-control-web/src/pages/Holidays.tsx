import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import api from '../api/axios';
import { handleApiError } from '../utils/errorHandler';
import { useConfirm } from '../components/ui/confirm/ConfirmDialogContext';
import { useToast } from '../components/ui/toast/ToastContext';
import HolidayDrawer from '../components/holidays/HolidayDrawer';
import styles from '../components/ui/table/Table.module.css';

export interface Holiday {
  id: number;
  holidayDate: string; // YYYY-MM-DD
  name: string;
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}.${month}.${year}`;
};

const getDayName = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  return days[date.getDay()];
};

export default function Holidays() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const currentYear = new Date().getFullYear().toString();
  const [selectedYear, setSelectedYear] = useState<string>(currentYear);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const navigate = useNavigate();
  const { confirm } = useConfirm();
  const { showToast } = useToast();

  const fetchHolidays = async (year: string) => {
    setIsLoading(true);
    setError('');
    try {
      const url = year === 'all' ? '/admin/holidays' : `/admin/holidays?year=${year}`;
      const response = await api.get(url);
      setHolidays(response.data);
    } catch (err: unknown) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    } else {
      fetchHolidays(selectedYear);
    }
  }, [navigate, selectedYear]);

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(e.target.value);
  };

  const handleNewHoliday = () => {
    setIsDrawerOpen(true);
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent row click
    const isConfirmed = await confirm({
      title: 'Tatili Sil',
      message: 'Bu tatil kaydını silmek istediğinize emin misiniz? Bu işlem kalıcıdır ve geri alınamaz.',
      confirmText: 'Evet, Sil',
      cancelText: 'Vazgeç',
      danger: true
    });

    if (isConfirmed) {
      try {
        await api.delete(`/admin/holidays/${id}`);
        showToast('Tatil başarıyla silindi', 'success');
        fetchHolidays(selectedYear);
      } catch (err: unknown) {
        setError(handleApiError(err));
      }
    }
  };

  const handleDrawerSuccess = () => {
    setIsDrawerOpen(false);
    fetchHolidays(selectedYear);
  };

  const generateYearOptions = () => {
    const currYear = new Date().getFullYear();
    const years = [];
    for (let i = currYear - 2; i <= currYear + 3; i++) {
      years.push(i.toString());
    }
    return years;
  };

  return (
    <div>
      {error && (
        <div style={{ marginBottom: 'var(--space-md)', padding: 'var(--space-md)', backgroundColor: 'var(--color-error-bg)', color: 'var(--color-error)', borderRadius: 'var(--radius-sm)' }}>
          {error}
        </div>
      )}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <label style={{ fontSize: 'var(--font-size-body-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-secondary)' }}>
            Yıl Filtresi:
          </label>
          <select 
            value={selectedYear} 
            onChange={handleYearChange}
            style={{
              height: '34px',
              padding: '0 var(--space-md)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--color-surface)',
              fontSize: 'var(--font-size-body)',
              color: 'var(--color-text-primary)'
            }}
          >
            <option value="all">Tümü</option>
            {generateYearOptions().map(yr => (
              <option key={yr} value={yr}>{yr}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleNewHoliday}
          style={{
            height: '34px',
            padding: '0 14px',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--color-accent)',
            color: 'var(--color-text-primary)',
            fontSize: 'var(--font-size-body)',
            fontWeight: 'var(--font-weight-bold)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(28,28,30,.10)'
          }}
        >
          + Yeni Tatil
        </button>
      </div>

      <div className={styles.card}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr>
              <th className={styles.th}>Tarih</th>
              <th className={styles.th}>Tatil Adı</th>
              <th className={styles.th}>Gün</th>
              <th className={styles.th} style={{ width: '40px' }}></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              // SKELETON
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className={styles.tr}>
                  <td className={styles.td}><div className={styles.skeleton} style={{ width: '90px' }}></div></td>
                  <td className={styles.td}><div className={styles.skeleton} style={{ width: '150px' }}></div></td>
                  <td className={styles.td}><div className={styles.skeleton} style={{ width: '70px' }}></div></td>
                  <td className={styles.td}></td>
                </tr>
              ))
            ) : holidays.length === 0 ? (
              // EMPTY STATE
              <tr>
                <td colSpan={4}>
                  <div className={styles.emptyState}>
                    Bu yıla ait tatil bulunamadı
                  </div>
                </td>
              </tr>
            ) : (
              // DATA
              holidays.map((holiday) => (
                <tr 
                  key={holiday.id} 
                  className={styles.tr}
                  style={{ cursor: 'default' }}
                >
                  <td className={styles.td} style={{ fontFamily: 'var(--font-family-mono)', fontWeight: 'var(--font-weight-medium)' }}>
                    {formatDate(holiday.holidayDate)}
                  </td>
                  <td className={styles.tdPrimary}>
                    {holiday.name}
                  </td>
                  <td className={styles.td}>
                    {getDayName(holiday.holidayDate)}
                  </td>
                  <td className={styles.td} style={{ textAlign: 'right' }}>
                    <button
                      onClick={(e) => handleDelete(holiday.id, e)}
                      title="Sil"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-error)',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 'var(--radius-sm)'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--color-error-bg)'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <HolidayDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSuccess={handleDrawerSuccess}
      />
    </div>
  );
}
