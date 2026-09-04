import type { NavigateFunction } from 'react-router-dom';

/**
 * Modül seviyesinde tutulan navigate referansı.
 * App.tsx içinde React Router mount olduktan sonra setNavigate() ile doldurulur.
 * axios interceptor gibi hook kullanamayan yerlerden SPA navigasyonu için kullanılır.
 */
let navigate: NavigateFunction | null = null;

export function setNavigate(fn: NavigateFunction) {
  navigate = fn;
}

export function navigateTo(path: string) {
  if (navigate) {
    navigate(path, { replace: true });
  } else {
    // Fallback: router henüz hazır değilse (çok nadir) hard redirect
    window.location.href = path;
  }
}
