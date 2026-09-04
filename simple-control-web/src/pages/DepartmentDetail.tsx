import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../api/axios';
import SearchInput from '../components/ui/searchinput/SearchInput';
import { normalizeTurkishString } from '../utils/stringUtils';
import tableStyles from '../components/ui/table/Table.module.css';
import Badge from '../components/ui/badge/Badge';

interface DepartmentDetail {
  id: number;
  name: string;
  description: string;
  active: boolean;
  employeeCount: number;
}

interface DepartmentEmployee {
  id: number;
  firstName: string;
  lastName: string;
  cardNo: string;
  workGroupName: string | null;
  hasAccount: boolean;
}

export default function DepartmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [department, setDepartment] = useState<DepartmentDetail | null>(null);
  const [employees, setEmployees] = useState<DepartmentEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const [deptRes, empRes] = await Promise.all([
          api.get(`/admin/departments/${id}`),
          api.get(`/admin/departments/${id}/employees`)
        ]);
        setDepartment(deptRes.data);
        setEmployees(empRes.data);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError('Departman bulunamadı');
        } else {
          setError('Departman bilgileri yüklenemedi');
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchDetail();
    }
  }, [id]);

  const normalizedSearch = normalizeTurkishString(searchTerm);
  const filteredEmployees = employees.filter(emp => {
    if (!normalizedSearch) return true;
    
    const nameMatch = normalizeTurkishString(`${emp.firstName} ${emp.lastName}`).includes(normalizedSearch);
    const cardMatch = normalizeTurkishString(emp.cardNo).includes(normalizedSearch);
    
    return nameMatch || cardMatch;
  });

  const handleRowClick = (empId: number) => {
    navigate(`/employees?edit=${empId}`);
  };

  if (loading) {
    return <div style={{ padding: 'var(--space-xl)' }}>Yükleniyor...</div>;
  }

  if (error || !department) {
    return (
      <div style={{ padding: 'var(--space-xl)' }}>
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <Link to="/departments" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-xs)', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>
            <ArrowLeft size={16} /> Departmanlara Dön
          </Link>
        </div>
        <div className={tableStyles.emptyState}>{error || 'Departman bulunamadı'}</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-xl)' }}>
      {/* Üst Kısım */}
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <Link to="/departments" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-xs)', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500, marginBottom: 'var(--space-md)' }}>
          <ArrowLeft size={16} /> Departmanlara Dön
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 var(--space-xs) 0' }}>
              {department.name}
            </h1>
            {department.description && (
              <div style={{ color: 'var(--color-text-secondary)' }}>{department.description}</div>
            )}
          </div>
          <div style={{ padding: 'var(--space-sm) var(--space-md)', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontWeight: 500 }}>
            {department.employeeCount} Personel
          </div>
        </div>
      </div>

      {/* Arama */}
      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Personel adı veya kart no ile ara"
        />
      </div>

      {/* Tablo */}
      <div className={tableStyles.card}>
        {employees.length === 0 ? (
          <div className={tableStyles.emptyState}>Bu departmana atanmış personel yok</div>
        ) : filteredEmployees.length === 0 ? (
          <div className={tableStyles.emptyState}>Aramanıza uygun kayıt bulunamadı</div>
        ) : (
          <table className={tableStyles.table}>
            <thead className={tableStyles.thead}>
              <tr>
                <th className={tableStyles.th}>Ad Soyad</th>
                <th className={tableStyles.th}>Kart No</th>
                <th className={tableStyles.th}>Çalışma Grubu</th>
                <th className={tableStyles.th}>Uygulama Erişimi</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map(emp => (
                <tr 
                  key={emp.id} 
                  className={tableStyles.tr}
                  onClick={() => handleRowClick(emp.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className={tableStyles.td}>{emp.firstName} {emp.lastName}</td>
                  <td className={tableStyles.td} style={{ fontFamily: 'monospace' }}>{emp.cardNo}</td>
                  <td className={tableStyles.td}>
                    {emp.workGroupName ? emp.workGroupName : <span style={{ color: 'var(--color-text-secondary)', opacity: 0.5 }}>—</span>}
                  </td>
                  <td className={tableStyles.td}>
                    {emp.hasAccount ? (
                      <Badge variant="success">Var</Badge>
                    ) : (
                      <span style={{ color: 'var(--color-text-secondary)' }}>Yok</span>
                    )}
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
