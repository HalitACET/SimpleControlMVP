import {useSyncExternalStore} from 'react';

export interface SessionData {
  fullName: string | null;
  role: string | null;
  firmId: string | null;
  username: string | null;
}

let state: SessionData = {
  fullName: null,
  role: null,
  firmId: null,
  username: null,
};

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach(listener => listener());
}

/**
 * Oturum bilgilerini yalnızca memory'de günceller (AsyncStorage/Keychain kullanmaz).
 * Kısmi güncelleme yapılabilir; verilmeyen alanlar mevcut değerini korur.
 */
export function setSession(data: Partial<SessionData>): void {
  state = {...state, ...data};
  emit();
}

export function clearSession(): void {
  state = {fullName: null, role: null, firmId: null, username: null};
  emit();
}

export function getSession(): SessionData {
  return state;
}

export function subscribeSession(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Ekranların oturum verisini reaktif okuması için hook.
 * setSession her çağrıldığında bu hook'u kullanan bileşenler yeniden render olur.
 */
export function useSession(): SessionData {
  return useSyncExternalStore(subscribeSession, getSession, getSession);
}
