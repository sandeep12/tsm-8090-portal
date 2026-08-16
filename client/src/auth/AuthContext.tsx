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
import type { AuthResponse, UserDto } from '../types/api';

type SignOutOptions = {
  /** When false, skip calling the server (used for invalid-session cleanup). */
  notifyServer?: boolean;
};

type AuthContextValue = {
  user: UserDto | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdministrator: boolean;
  api: ApiClient;
  setSession: (token: string, user: UserDto) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: (options?: SignOutOptions) => Promise<void>;
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

  const clearLocalSession = useCallback(() => {
    clearSessionToken();
    clearStoredUser();
    setToken(null);
    setUser(null);
  }, []);

  const api = useMemo(
    () =>
      new ApiClient({
        baseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
        getToken: () => tokenRef.current,
        onUnauthorized: () => {
          clearLocalSession();
        },
      }),
    [clearLocalSession],
  );

  const setSession = useCallback((nextToken: string, nextUser: UserDto) => {
    saveSessionToken(nextToken);
    saveStoredUser(nextUser);
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const response = await api.post<AuthResponse>(
        '/api/auth/sign-in',
        { email, password },
        { auth: false },
      );
      setSession(response.token, response.user);
    },
    [api, setSession],
  );

  const signOut = useCallback(
    async (options: SignOutOptions = {}) => {
      const existingToken = tokenRef.current;
      const shouldNotify = options.notifyServer !== false;

      clearLocalSession();

      if (shouldNotify && existingToken) {
        try {
          await api.post('/api/auth/sign-out', undefined);
        } catch {
          // Local session is already cleared; ignore server errors on sign-out.
        }
      }
    },
    [api, clearLocalSession],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isAdministrator: user?.role === 'Administrator',
      api,
      setSession,
      signIn,
      signOut,
    }),
    [user, token, api, setSession, signIn, signOut],
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
