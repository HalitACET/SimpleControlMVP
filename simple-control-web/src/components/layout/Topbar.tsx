import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './Topbar.module.css';

const routeMappings: Record<string, { group: string; title: string }> = {
  '/employees': { group: 'Tanımlar', title: 'Personel Listesi' },
  '/shifts': { group: 'Tanımlar', title: 'Vardiyalar' },
  '/work-groups': { group: 'Tanımlar', title: 'Çalışma Grupları' },
  '/holidays': { group: 'Tanımlar', title: 'Tatiller' },
  '/styleguide': { group: 'Sistem', title: 'Tasarım Sistemi' }
};

export default function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const routeInfo = routeMappings[location.pathname] || { group: '', title: '' };

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
