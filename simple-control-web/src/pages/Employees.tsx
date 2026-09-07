import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { handleApiError } from '../utils/errorHandler';
import EmployeeDrawer from '../components/employees/EmployeeDrawer';
import SearchInput from '../components/ui/searchinput/SearchInput';
import Badge from '../components/ui/badge/Badge';
import { normalizeTurkishString } from '../utils/stringUtils';
import styles from './Employees.module.css';

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  cardNo: string;
  workGroupName?: string;
  departmentId?: number;
  departmentName?: string;
  active: boolean;
  hasAccount: boolean;
}

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/admin/employees?includeInactive=${includeInactive}`);
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
  }, [navigate, includeInactive]);

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

  const normalizedSearch = normalizeTurkishString(searchTerm);
  const filteredEmployees = employees.filter(emp => {
    if (!normalizedSearch) return true;
    
    const nameMatch = normalizeTurkishString(`${emp.firstName} ${emp.lastName}`).includes(normalizedSearch);
    const cardMatch = normalizeTurkishString(emp.cardNo).includes(normalizedSearch);
    
    return nameMatch || cardMatch;
  });

  return (
    <div className={styles.page}>
      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}
      
      <div className={styles.header}>
        <div className={styles.searchContainer}>
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Personel adı, soyadı veya kart no ile ara"
          />
          <label className={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              checked={includeInactive} 
              onChange={e => setIncludeInactive(e.target.checked)} 
              className={styles.checkbox}
            />
            Pasif personelleri göster
          </label>
        </div>
        <button
          onClick={handleNewPersonel}
          className={styles.btnNew}
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
              <th className={styles.th}>DURUM</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className={styles.tr}>
                  <td className={styles.td}><div className={styles.skeleton} /></td>
                  <td className={styles.td}><div className={styles.skeleton} /></td>
                  <td className={styles.td}><div className={styles.skeleton} /></td>
                  <td className={styles.td}><div className={styles.skeleton} /></td>
                  <td className={styles.td}><div className={styles.skeleton} /></td>
                </tr>
              ))
            ) : filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.emptyState}>
                  {searchTerm ? 'Aramanıza uygun personel bulunamadı.' : 'Henüz personel eklenmemiş.'}
                </td>
              </tr>
            ) : (
              filteredEmployees.map(emp => (
                <tr 
                  key={emp.id} 
                  className={`${styles.tr} ${!emp.active ? styles.trInactive : ''}`}
                  onClick={() => handleEditPersonel(emp)}
                >
                  <td className={styles.td}>{emp.firstName} {emp.lastName}</td>
                  <td className={`${styles.td} ${styles.mono}`}>{emp.cardNo}</td>
                  <td className={styles.td}>{emp.workGroupName || <span className={styles.placeholder}>—</span>}</td>
                  <td className={styles.td}>{emp.departmentName || <span className={styles.placeholder}>—</span>}</td>
                  <td className={styles.td}>
                    {emp.active ? (
                      <Badge variant="success">Aktif</Badge>
                    ) : (
                      <Badge variant="neutral">Pasif</Badge>
                    )}
                  </td>
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
