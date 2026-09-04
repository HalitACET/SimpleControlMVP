import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { handleApiError } from '../utils/errorHandler';
import EmployeeDrawer from '../components/employees/EmployeeDrawer';
import styles from '../components/ui/table/Table.module.css';

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  cardNo: string;
  workGroupId?: number;
  workGroupName?: string;
  departmentId?: number;
  departmentName?: string;
}

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

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

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && employees.length > 0) {
      const emp = employees.find(e => e.id === Number(editId));
      if (emp) {
        setSelectedEmployee(emp);
        setIsDrawerOpen(true);
      }
    }
  }, [searchParams, employees]);

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    if (searchParams.get('edit')) {
      searchParams.delete('edit');
      setSearchParams(searchParams, { replace: true });
    }
  };

  const handleNewPersonel = () => {
    setSelectedEmployee(null);
    setIsDrawerOpen(true);
  };

  const handleEditPersonel = (emp: Employee) => {
    setSelectedEmployee(emp);
    setIsDrawerOpen(true);
  };

  const handleDrawerSuccess = () => {
    handleDrawerClose();
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
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'opacity 0.2s'
          }}
        >
          Yeni Personel
        </button>
      </div>

      <div className={styles.card}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr>
                <th className={styles.th}>AD SOYAD</th>
              <th className={styles.th}>KART NO</th>
              <th className={styles.th}>ÇALIŞMA GRUBU</th>
              <th className={styles.th}>DEPARTMAN</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className={styles.td} style={{ textAlign: 'center' }}>
                  Yükleniyor...
                </td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={4} className={styles.td} style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  Henüz personel bulunmuyor.
                </td>
              </tr>
            ) : (
              employees.map(emp => (
                <tr 
                  key={emp.id} 
                  className={styles.tr}
                  onClick={() => handleEditPersonel(emp)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className={styles.td}>{emp.firstName} {emp.lastName}</td>
                  <td className={styles.td} style={{ fontFamily: 'monospace' }}>{emp.cardNo}</td>
                  <td className={styles.td}>{emp.workGroupName || <span style={{ color: 'var(--color-text-secondary)' }}>—</span>}</td>
                  <td className={styles.td}>{emp.departmentName || <span style={{ color: 'var(--color-text-secondary)' }}>—</span>}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <EmployeeDrawer
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
        onSuccess={handleDrawerSuccess}
        employeeToEdit={selectedEmployee}
      />
    </div>
  );
}
