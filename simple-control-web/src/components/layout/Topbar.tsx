import { useLocation, useNavigate } from 'react-router-dom';
import styles from './Topbar.module.css';

const routeMappings: Record<string, { group: string; title: string }> = {
  '/employees': { group: 'Tanımlar', title: 'Personel Listesi' },
  '/shifts': { group: 'Tanımlar', title: 'Vardiyalar' },
  '/work-groups': { group: 'Tanımlar', title: 'Çalışma Grupları' },
  '/holidays': { group: 'Tanımlar', title: 'Tatiller' },
  '/scans': { group: 'İşlemler', title: 'Hareket Kayıtları' },
  '/reports/daily': { group: 'Raporlar', title: 'Günlük Rapor' },
  '/reports/monthly': { group: 'Raporlar', title: 'Aylık Puantaj' },
  '/users': { group: 'Sistem', title: 'Kullanıcı Hesapları' },
  '/styleguide': { group: 'Sistem', title: 'Tasarım Sistemi' }
};

export default function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  
  let routeInfo = routeMappings[location.pathname];
  
  if (!routeInfo && location.pathname.startsWith('/reports/monthly/')) {
    routeInfo = { group: 'Raporlar', title: 'Aylık Puantaj Detayı' };
  }
  
  if (!routeInfo) {
    routeInfo = { group: '', title: '' };
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <header className={styles.topbar}>
      <div className={styles.titleArea}>
        {routeInfo.group && <div className={styles.breadcrumb}>{routeInfo.group}</div>}
        <h1 className={styles.pageTitle}>{routeInfo.title}</h1>
      </div>
      <div className={styles.userMenuContainer}>
        <div className={styles.userMenuButton}>
          <div className={styles.userAvatar}>K</div>
          <div className={styles.userName}>Kullanıcı</div>
          <button className={styles.logoutButton} onClick={handleLogout}>Çıkış</button>
        </div>
      </div>
    </header>
  );
}

