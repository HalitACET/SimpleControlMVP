import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../components/ui/toast/ToastContext';
import styles from './Departments.module.css';
import { DepartmentDrawer, type Department } from '../components/departments/DepartmentDrawer';

export default function Departments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);

  const navigate = useNavigate();
  const { showToast } = useToast();

  const fetchDepartments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/departments');
      setDepartments(res.data);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Departmanlar yüklenemedi';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleOpenNew = () => {
    setSelectedDept(null);
    setDrawerOpen(true);
  };

  const handleOpenEdit = (e: React.MouseEvent, dept: Department) => {
    e.stopPropagation(); // Tıklamanın karta (detaya gitmeye) yayılmasını engelle
    setSelectedDept(dept);
    setDrawerOpen(true);
  };

  const handleCardClick = (id: number) => {
    navigate(`/departments/${id}`);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.subtitle}>
          Çalışanları sınıflandırmak için departmanlar oluşturun.
        </div>
        <button className={styles.btnNew} onClick={handleOpenNew}>Yeni Departman</button>
      </div>

      {error ? (
        <div className={styles.emptyState}>{error}</div>
      ) : loading ? (
        <div className={styles.grid}>
          {[1, 2, 3].map(i => (
            <div key={i} className={styles.card} style={{ opacity: 0.5 }}>
              <div className={styles.headerRow}>
                <div style={{ width: '60%', height: '24px', backgroundColor: 'var(--color-border)', borderRadius: '4px' }} />
              </div>
              <div style={{ width: '80%', height: '16px', backgroundColor: 'var(--color-border)', borderRadius: '4px', marginBottom: '8px' }} />
              <div style={{ width: '40%', height: '16px', backgroundColor: 'var(--color-border)', borderRadius: '4px', marginBottom: 'var(--space-xl)' }} />
              <div className={styles.footer}>
                <div style={{ width: '30%', height: '16px', backgroundColor: 'var(--color-border)', borderRadius: '4px' }} />
              </div>
            </div>
          ))}
        </div>
      ) : departments.length === 0 ? (
        <div className={styles.emptyState}>Henüz departman eklenmemiş.</div>
      ) : (
        <div className={styles.grid}>
          {departments.map(dept => (
            <div key={dept.id} className={styles.card} onClick={() => handleCardClick(dept.id)}>
              <div className={styles.headerRow}>
                <h3 className={styles.title}>{dept.name}</h3>
                <button 
                  className={styles.editButton} 
                  onClick={(e) => handleOpenEdit(e, dept)}
                  title="Düzenle"
                >
                  <Pencil size={16} />
                </button>
              </div>
              <div className={styles.description}>
                {dept.description || '-'}
              </div>
              <div className={styles.footer}>
                <span className={`${styles.employeeCount} ${dept.employeeCount > 0 ? styles.hasEmployees : styles.noEmployees}`}>
                  {dept.employeeCount > 0 ? `${dept.employeeCount} personel` : 'Personel yok'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <DepartmentDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={fetchDepartments}
        department={selectedDept}
      />
    </div>
  );
}
