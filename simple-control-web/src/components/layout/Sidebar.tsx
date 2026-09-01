import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Users, Cpu, MapPin, Clock, CalendarDays, FileText, Palette, ChevronsLeft, ChevronsRight, Layers, Sun, UserCog } from 'lucide-react';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });
  
  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', collapsed.toString());
  }, [collapsed]);

  const location = useLocation();

    const groups = [
    {
      label: 'Tanımlar',
      items: [
        { label: 'Personel', path: '/employees', icon: <Users size={18} /> },
        { label: 'Cihazlar', path: '#cihazlar', icon: <Cpu size={18} /> },
        { label: 'Lokasyonlar', path: '#lokasyonlar', icon: <MapPin size={18} /> },
        { label: 'Vardiyalar', path: '/shifts', icon: <CalendarDays size={18} /> },
        { label: 'Çalışma Grupları', path: '/work-groups', icon: <Layers size={18} /> },
        { label: 'Tatiller', path: '/holidays', icon: <Sun size={18} /> },
      ],
    },
    {
      label: 'İşlemler',
      items: [
        { label: 'Hareket Kayıtları', path: '/scans', icon: <Clock size={18} /> },
      ],
    },
    {
      label: 'Raporlar',
      items: [
        { label: 'Günlük Rapor', path: '/reports/daily', icon: <FileText size={18} /> },
        { label: 'Aylık Puantaj', path: '/reports/monthly', icon: <CalendarDays size={18} /> },
      ],
    },
    {
      label: 'Sistem',
      items: [
        { label: 'Kullanıcı Hesapları', path: '/users', icon: <UserCog size={18} /> },
        { label: 'Tasarım Sistemi', path: '/styleguide', icon: <Palette size={18} /> },
      ],
    },
  ];

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.logoArea}>
        <div className={styles.logoIcon}>SC</div>
        <div className={styles.logoTextContainer}>
          <div className={styles.logoTitle}>Simple Control</div>
          <div className={styles.logoSubtitle}>PDKS Yönetim</div>
        </div>
      </div>

      <nav className={styles.nav}>
        {groups.map((group, idx) => (
          <div key={idx} className={styles.group}>
            <div className={styles.groupLabel}>{group.label}</div>
            {group.items.map((item, iIdx) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={iIdx}
                  to={item.path}
                  className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                  title={item.label}
                >
                  <span className={styles.navItemIndicator}></span>
                  <span className={styles.navItemIcon}>{item.icon}</span>
                  <span className={styles.navItemText}>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className={styles.footer}>
        <button
          className={styles.collapseButton}
          onClick={() => setCollapsed(!collapsed)}
          title="Menüyü daralt/genişlet"
        >
          <span className={styles.collapseIcon}>{collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}</span>
          <span className={styles.collapseText}>Menüyü daralt</span>
        </button>
      </div>
    </aside>
  );
}

