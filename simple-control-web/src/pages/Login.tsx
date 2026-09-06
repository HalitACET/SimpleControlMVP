import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { handleApiError } from '../utils/errorHandler';
import FormInput from '../components/ui/form/FormInput';
import styles from './Login.module.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const usernameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', {
        firmId: import.meta.env.VITE_FIRM_ID,
        username,
        password,
      });

      const token = response.data.token;
      if (token) {
        localStorage.setItem('token', token);
        navigate('/employees');
      }
    } catch (err: unknown) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logoIcon}>SC</div>
          <h1 className={styles.title}>Simple Control</h1>
          <div className={styles.subtitle}>PDKS Yönetim</div>
        </div>
        
        <div className={styles.divider}></div>
        
        <form onSubmit={handleLogin} className={styles.form}>
          <FormInput
            ref={usernameRef}
            label="Kart No / Kullanıcı Adı"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
            required
          />
          <FormInput
            label="Şifre"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
          />
          {error && <div className={styles.errorBox}>{error}</div>}
          <button 
            type="submit" 
            className={styles.submitBtn}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className={styles.spinner}></span>
                Giriş yapılıyor...
              </>
            ) : (
              'Giriş Yap'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
