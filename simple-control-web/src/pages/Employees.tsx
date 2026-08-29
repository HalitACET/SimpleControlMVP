import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { handleApiError } from '../utils/errorHandler';
import EmployeeDrawer from '../components/employees/EmployeeDrawer';
import styles from './Employees.module.css';

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  cardNo: string;
}

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const navigate = useNavigate();

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/admin/employees');
      setEmployees(response.data);
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
      fetchEmployees();
    }
  }, [navigate]);

  const handleNewPersonel = () => {
    setSelectedEmployee(null);
    setIsDrawerOpen(true);
  };

  const handleEditPersonel = (emp: Employee) => {
    setSelectedEmployee(emp);
    setIsDrawerOpen(true);
  };

  const handleDrawerSuccess = () => {
    setIsDrawerOpen(false);
    fetchEmployees();
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
          onClick={handleNewPersonel}
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
          ＋ Yeni Personel
        </button>
      </div>

      <div className={styles.card}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr>
              <th className={styles.th}>Ad Soyad</th>
              <th className={styles.th} style={{ width: '150px' }}>Kart No</th>
              <th className={styles.th} style={{ width: '120px' }}>Durum</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              // SKELETON
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className={styles.tr}>
                  <td className={styles.td}><div className={styles.skeleton} style={{ width: '120px' }}></div></td>
                  <td className={styles.td}><div className={styles.skeleton} style={{ width: '80px' }}></div></td>
                  <td className={styles.td}><div className={styles.skeleton} style={{ width: '60px', borderRadius: 'var(--radius-full)' }}></div></td>
                </tr>
              ))
            ) : employees.length === 0 ? (
              // EMPTY STATE
              <tr>
                <td colSpan={3}>
                  <div className={styles.emptyState}>
                    Henüz personel eklenmemiş
                  </div>
                </td>
              </tr>
            ) : (
              // DATA
              employees.map((emp) => (
                <tr 
                  key={emp.id} 
                  className={styles.tr}
                  onClick={() => handleEditPersonel(emp)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleEditPersonel(emp);
                  }}
                  role="button"
                >
                  <td className={styles.tdPrimary}>
                    {emp.firstName} {emp.lastName}
                  </td>
                  <td className={styles.tdMono}>{emp.cardNo}</td>
                  <td className={styles.td}>
                    <span className={styles.statusBadge}>Aktif</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <EmployeeDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSuccess={handleDrawerSuccess}
        employeeToEdit={selectedEmployee}
      />
    </div>
  );
}
