import { useEffect, useState } from 'react';
import api from '../api/axios';
import Badge from '../components/ui/badge/Badge';
import tableStyles from '../components/ui/table/Table.module.css';
import { EditUserDrawer, type UserAccount } from '../components/users/UserAccountDrawers';
import { useToast } from '../components/ui/toast/ToastContext';
import SearchInput from '../components/ui/searchinput/SearchInput';
import { normalizeTurkishString } from '../utils/stringUtils';
import styles from './UserAccounts.module.css';

export default function UserAccounts() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleEditSuccess = () => {
    setSelectedUser(null);
    fetchUsers();
  };

  const normalizedSearch = normalizeTurkishString(searchTerm);
  const filteredUsers = users.filter(user => {
    if (!normalizedSearch) return true;
    
    const nameMatch = normalizeTurkishString(user.employeeName).includes(normalizedSearch);
    const cardMatch = normalizeTurkishString(user.cardNo).includes(normalizedSearch);
    const usernameMatch = normalizeTurkishString(user.username).includes(normalizedSearch);
    
    return nameMatch || cardMatch || usernameMatch;
  });

  return (
    <div className={styles.container}>
      {/* Açıklama */}
      <div className={styles.descriptionText}>
        Hesaplar personel kaydı üzerinden oluşturulur. Bu ekrandan şifre sıfırlayabilir ve erişimi kapatabilirsiniz.
      </div>

      {/* Arama */}
      <div className={styles.searchContainer}>
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Personel adı veya kart no ile ara"
        />
      </div>

      {/* Tablo */}
      <div className={tableStyles.card}>
        {error ? (
          <div className={tableStyles.emptyState}>{error}</div>
        ) : loading ? (
          <div className={tableStyles.emptyState}>Yükleniyor...</div>
        ) : users.length === 0 ? (
          <div className={tableStyles.emptyState}>Henüz hiç kullanıcı hesabı yok.</div>
        ) : filteredUsers.length === 0 ? (
          <div className={tableStyles.emptyState}>Aramanıza uygun kayıt bulunamadı</div>
        ) : (
          <table className={tableStyles.table}>
            <thead className={tableStyles.thead}>
              <tr>
                <th className={tableStyles.th}>Giriş Kimliği</th>
                <th className={tableStyles.th}>Personel</th>
                <th className={`${tableStyles.th} ${styles.colCardNo}`}>Kart No</th>
                <th className={`${tableStyles.th} ${styles.colStatus}`}>Durum</th>
                <th className={`${tableStyles.th} ${styles.colPassword}`}>Şifre Değiştirmeli</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr
                  key={user.id}
                  className={`${tableStyles.tr} ${styles.clickableRow}`}
                  onClick={() => setSelectedUser(user)}
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
                      : <span className={styles.mutedDash}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

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
