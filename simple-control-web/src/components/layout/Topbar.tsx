import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './Topbar.module.css';

export default function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Basic routing logic for titles
  let breadcrumb = 'PDKS Yönetim';
  let title = 'Sayfa';

  if (location.pathname === '/employees') {
    breadcrumb = 'Tanımlar';
    title = 'Personel Listesi';
  } else if (location.pathname === '/styleguide') {
    breadcrumb = 'Sistem';
    title = 'Tasarım Sistemi';
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <header className={styles.topbar}>
      <div className={styles.titleArea}>
        <div className={styles.breadcrumb}>{breadcrumb}</div>
        <h1 className={styles.pageTitle}>{title}</h1>
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
