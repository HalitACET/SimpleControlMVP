import { useEffect, useState } from 'react';
import Badge from '../components/ui/badge/Badge';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { handleApiError } from '../utils/errorHandler';
import ShiftDrawer from '../components/shifts/ShiftDrawer';
import styles from '../components/ui/table/Table.module.css';

export interface Shift {
  id: number;
  name: string;
  startTime: string; // e.g. "08:00:00"
  endTime: string;
  durationMinutes: number;
  breakStart: string | null; // e.g. "12:30:00"
  breakEnd: string | null;
  lateToleranceMinutes: number;
  earlyExitToleranceMinutes: number;
  crossesMidnight: boolean;
}

const formatTime = (timeStr: string) => {
  if (!timeStr) return '';
  return timeStr.substring(0, 5); // "08:00:00" -> "08:00"
};

const formatDuration = (totalMinutes: number) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) return `${hours}s ${minutes}dk`;
  if (hours > 0) return `${hours}s`;
  return `${minutes}dk`;
};

export default function Shifts() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

  const navigate = useNavigate();

  const fetchShifts = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/admin/shifts');
      setShifts(response.data);
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
      fetchShifts();
    }
  }, [navigate]);

  const handleNewShift = () => {
    setSelectedShift(null);
    setIsDrawerOpen(true);
  };

  const handleEditShift = (shift: Shift) => {
    setSelectedShift(shift);
    setIsDrawerOpen(true);
  };

  const handleDrawerSuccess = () => {
    setIsDrawerOpen(false);
    fetchShifts();
  };

  return (
    <div>
      {error && (
        <div style={{ marginBottom: 'var(--space-md)', padding: 'var(--space-md)', backgroundColor: 'var(--color-error-bg)', color: 'var(--color-error)', borderRadius: 'var(--radius-sm)' }}>
          {error}
        </div>
      )}
      
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-lg)' }}>
        <button
          onClick={handleNewShift}
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
          + Yeni Vardiya
        </button>
      </div>

      <div className={styles.card}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr>
              <th className={styles.th}>Vardiya Adı</th>
              <th className={styles.th}>Saat Aralığı</th>
              <th className={styles.th}>Süre</th>
              <th className={styles.th}>Mola</th>
              <th className={styles.th}>Tolerans (Geç / Erken)</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              // SKELETON
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className={styles.tr}>
                  <td className={styles.td}><div className={styles.skeleton} style={{ width: '120px' }}></div></td>
                  <td className={styles.td}><div className={styles.skeleton} style={{ width: '100px' }}></div></td>
                  <td className={styles.td}><div className={styles.skeleton} style={{ width: '60px' }}></div></td>
                  <td className={styles.td}><div className={styles.skeleton} style={{ width: '50px' }}></div></td>
                  <td className={styles.td}><div className={styles.skeleton} style={{ width: '80px' }}></div></td>
                </tr>
              ))
            ) : shifts.length === 0 ? (
              // EMPTY STATE
              <tr>
                <td colSpan={5}>
                  <div className={styles.emptyState}>
                    Henüz vardiya eklenmemiş
                  </div>
                </td>
              </tr>
            ) : (
              // DATA
              shifts.map((shift) => (
                <tr 
                  key={shift.id} 
                  className={styles.tr}
                  onClick={() => handleEditShift(shift)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleEditShift(shift);
                  }}
                  role="button"
                >
                  <td className={styles.tdPrimary}>
                    {shift.name}
                  </td>
                  <td className={styles.tdMono}>
                    {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                    {shift.crossesMidnight && (
                      <Badge variant="info" className={styles.nightBadge}>Gece</Badge>
                    )}
                  </td>
                  <td className={styles.td}>
                    {formatDuration(shift.durationMinutes)}
                  </td>
                  <td className={styles.td}>
                    {shift.breakStart && shift.breakEnd
                      ? `${formatTime(shift.breakStart)} – ${formatTime(shift.breakEnd)}`
                      : '—'}
                  </td>
                  <td className={styles.td}>
                    {shift.lateToleranceMinutes} dk / {shift.earlyExitToleranceMinutes} dk
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ShiftDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSuccess={handleDrawerSuccess}
        shiftToEdit={selectedShift}
      />
    </div>
  );
}
