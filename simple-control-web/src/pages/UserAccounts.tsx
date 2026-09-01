import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import api from '../api/axios';
import Badge from '../components/ui/badge/Badge';
import tableStyles from '../components/ui/table/Table.module.css';
import { CreateUserDrawer, EditUserDrawer, type UserAccount } from '../components/users/UserAccountDrawers';
import { useToast } from '../components/ui/toast/ToastContext';

export default function UserAccounts() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const { showToast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/users-v2');
      setUsers(res.data);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Kullanıcılar yüklenemedi';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Hesabı olan personel ID'leri — CreateUserDrawer'ın filtrelemesi için
  // Mevcut kullanıcıların employeeId'lerinden bir Set oluşturuyoruz.
  // Bu Set drawer'a prop olarak geçiliyor; drawer personel listesini bu Set'e bakarak filtreli sunuyor.
  const existingEmployeeIds = new Set(users.map(u => u.employeeId));

  const handleCreateSuccess = () => {
    setIsCreateOpen(false);
    fetchUsers();
  };

  const handleEditSuccess = () => {
    setSelectedUser(null);
    fetchUsers();
  };

  return (
    <div style={{ padding: 'var(--space-xl)' }}>
      {/* Üst çubuk */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-lg)' }}>
        <button
          className="btn btn-primary"
          onClick={() => setIsCreateOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Plus size={18} /> Yeni Hesap
        </button>
      </div>

      {/* Tablo */}
      <div className={tableStyles.card}>
        {error ? (
          <div className={tableStyles.emptyState}>{error}</div>
        ) : loading ? (
          <div className={tableStyles.emptyState}>Yükleniyor...</div>
        ) : users.length === 0 ? (
          <div className={tableStyles.emptyState}>Henüz hiç kullanıcı hesabı yok.</div>
        ) : (
          <table className={tableStyles.table}>
            <thead className={tableStyles.thead}>
              <tr>
                <th className={tableStyles.th}>Kullanıcı Adı</th>
                <th className={tableStyles.th}>Personel</th>
                <th className={tableStyles.th} style={{ width: '110px' }}>Kart No</th>
                <th className={tableStyles.th} style={{ width: '110px' }}>Durum</th>
                <th className={tableStyles.th} style={{ width: '150px' }}>Şifre Değiştirmeli</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr
                  key={user.id}
                  className={tableStyles.tr}
                  onClick={() => setSelectedUser(user)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className={tableStyles.tdMono}>{user.username}</td>
                  <td className={tableStyles.tdPrimary}>{user.employeeName}</td>
                  <td className={tableStyles.tdMono}>{user.cardNo}</td>
                  <td className={tableStyles.td}>
                    <Badge variant={user.active ? 'success' : 'neutral'}>
                      {user.active ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </td>
                  <td className={tableStyles.td}>
                    {user.mustChangePassword
                      ? <Badge variant="warning">Beklemede</Badge>
                      : <span style={{ color: 'var(--color-text-secondary)' }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Yeni hesap drawer */}
      <CreateUserDrawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleCreateSuccess}
        existingEmployeeIds={existingEmployeeIds}
      />

      {/* Mevcut hesap drawer */}
      <EditUserDrawer
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        onSuccess={handleEditSuccess}
        user={selectedUser}
      />
    </div>
  );
}
