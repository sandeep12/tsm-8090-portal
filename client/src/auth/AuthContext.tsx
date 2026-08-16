import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { ApiClient } from '../api/client';
import {
  clearSessionToken,
  loadSessionToken,
  saveSessionToken,
} from '../api/token-storage';
import type { UserDto } from '../types/api';

type AuthContextValue = {
  user: UserDto | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdministrator: boolean;
  api: ApiClient;
  /** Establish a session after successful sign-in (WO-5). */
  setSession: (token: string, user: UserDto) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const USER_KEY = 'tsm.sessionUser';

function loadStoredUser(): UserDto | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserDto;
  } catch {
    return null;
  }
}

function saveStoredUser(user: UserDto): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearStoredUser(): void {
  localStorage.removeItem(USER_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => loadSessionToken());
  const [user, setUser] = useState<UserDto | null>(() => loadStoredUser());

  const tokenRef = useRef(token);
  tokenRef.current = token;

  const signOut = useCallback(() => {
    clearSessionToken();
    clearStoredUser();
    setToken(null);
    setUser(null);
  }, []);

  const signOutRef = useRef(signOut);
  signOutRef.current = signOut;

  const api = useMemo(
    () =>
      new ApiClient({
        baseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
        getToken: () => tokenRef.current,
        onUnauthorized: () => signOutRef.current(),
      }),
    [],
  );

  const setSession = useCallback((nextToken: string, nextUser: UserDto) => {
    saveSessionToken(nextToken);
    saveStoredUser(nextUser);
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isAdministrator: user?.role === 'Administrator',
      api,
      setSession,
      signOut,
    }),
    [user, token, api, setSession, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
