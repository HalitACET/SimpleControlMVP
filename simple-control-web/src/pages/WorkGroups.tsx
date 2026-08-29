import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { handleApiError } from '../utils/errorHandler';
import WorkGroupDrawer from '../components/work-groups/WorkGroupDrawer';
import styles from '../components/ui/table/Table.module.css';

export interface WorkGroupDay {
  dayOfWeek: number;
  shiftId: number | null;
  shiftName: string | null;
  shiftStartTime: string | null;
  shiftEndTime: string | null;
}

export interface WorkGroup {
  id: number;
  name: string;
  dailyWorkMinutes: number;
  active: boolean;
  employeeCount: number;
  days: WorkGroupDay[];
}

export interface WorkGroupListResponse {
  id: number;
  name: string;
  dailyWorkMinutes: number;
  employeeCount: number;
  activeDaysCount: number;
}

const formatDuration = (totalMinutes: number) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) return `${hours}s ${minutes}dk`;
  if (hours > 0) return `${hours}s`;
  return `${minutes}dk`;
};

export default function WorkGroups() {
  const [workGroups, setWorkGroups] = useState<WorkGroupListResponse[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<WorkGroup | null>(null);

  const navigate = useNavigate();

  const fetchWorkGroups = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/admin/work-groups');
      setWorkGroups(response.data);
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
      fetchWorkGroups();
    }
  }, [navigate]);

  const handleNewGroup = () => {
    setSelectedGroup(null);
    setIsDrawerOpen(true);
  };

  const handleEditGroup = async (groupListRes: WorkGroupListResponse) => {
    try {
      const response = await api.get(`/admin/work-groups/${groupListRes.id}`);
      setSelectedGroup(response.data);
      setIsDrawerOpen(true);
    } catch (err: unknown) {
      setError(handleApiError(err));
    }
  };

  const handleDrawerSuccess = () => {
    setIsDrawerOpen(false);
    fetchWorkGroups();
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
          onClick={handleNewGroup}
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
          + Yeni Çalışma Grubu
        </button>
      </div>

      <div className={styles.card}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr>
              <th className={styles.th}>Grup Adı</th>
              <th className={styles.th}>Günlük Çalışma Süresi</th>
              <th className={styles.th}>Çalışılan Gün Sayısı</th>
              <th className={styles.th}>Personel Sayısı</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              // SKELETON
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className={styles.tr}>
                  <td className={styles.td}><div className={styles.skeleton} style={{ width: '150px' }}></div></td>
                  <td className={styles.td}><div className={styles.skeleton} style={{ width: '80px' }}></div></td>
                  <td className={styles.td}><div className={styles.skeleton} style={{ width: '60px' }}></div></td>
                  <td className={styles.td}><div className={styles.skeleton} style={{ width: '50px' }}></div></td>
                </tr>
              ))
            ) : workGroups.length === 0 ? (
              // EMPTY STATE
              <tr>
                <td colSpan={4}>
                  <div className={styles.emptyState}>
                    Henüz çalışma grubu eklenmemiş
                  </div>
                </td>
              </tr>
            ) : (
              // DATA
              workGroups.map((group) => {
                return (
                  <tr 
                    key={group.id} 
                    className={styles.tr}
                    onClick={() => handleEditGroup(group)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleEditGroup(group);
                    }}
                    role="button"
                  >
                    <td className={styles.tdPrimary}>
                      {group.name}
                    </td>
                    <td className={styles.td}>
                      {formatDuration(group.dailyWorkMinutes)}
                    </td>
                    <td className={styles.td}>
                      {group.activeDaysCount} / 7
                    </td>
                    <td className={styles.td}>
                      {group.employeeCount}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <WorkGroupDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSuccess={handleDrawerSuccess}
        groupToEdit={selectedGroup}
      />
    </div>
  );
}
