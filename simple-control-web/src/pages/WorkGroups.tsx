import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { handleApiError } from '../utils/errorHandler';
import WorkGroupDrawer from '../components/work-groups/WorkGroupDrawer';
import tableStyles from '../components/ui/table/Table.module.css';
import styles from './WorkGroups.module.css';

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
        <div className={styles.errorBanner}>
          {error}
        </div>
      )}
      
      <div className={styles.actionRow}>
        <button
          onClick={handleNewGroup}
          className={styles.newGroupButton}
        >
          + Yeni Çalışma Grubu
        </button>
      </div>

      <div className={tableStyles.card}>
        <table className={tableStyles.table}>
          <thead className={tableStyles.thead}>
            <tr>
              <th className={tableStyles.th}>Grup Adı</th>
              <th className={tableStyles.th}>Günlük Çalışma Süresi</th>
              <th className={tableStyles.th}>Çalışılan Gün Sayısı</th>
              <th className={tableStyles.th}>Personel Sayısı</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              // SKELETON
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className={tableStyles.tr}>
                  <td className={tableStyles.td}><div className={`${tableStyles.skeleton} ${styles.skeletonName}`}></div></td>
                  <td className={tableStyles.td}><div className={`${tableStyles.skeleton} ${styles.skeletonDuration}`}></div></td>
                  <td className={tableStyles.td}><div className={`${tableStyles.skeleton} ${styles.skeletonDays}`}></div></td>
                  <td className={tableStyles.td}><div className={`${tableStyles.skeleton} ${styles.skeletonCount}`}></div></td>
                </tr>
              ))
            ) : workGroups.length === 0 ? (
              // EMPTY STATE
              <tr>
                <td colSpan={4}>
                  <div className={tableStyles.emptyState}>
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
                    className={tableStyles.tr}
                    onClick={() => handleEditGroup(group)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleEditGroup(group);
                    }}
                    role="button"
                  >
                    <td className={tableStyles.tdPrimary}>
                      {group.name}
                    </td>
                    <td className={tableStyles.td}>
                      {formatDuration(group.dailyWorkMinutes)}
                    </td>
                    <td className={tableStyles.td}>
                      {group.activeDaysCount} / 7
                    </td>
                    <td className={tableStyles.td}>
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
