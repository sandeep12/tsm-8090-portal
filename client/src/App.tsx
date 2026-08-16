import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { AppLayout } from './components/AppLayout';
import { RouteGuard } from './components/RouteGuard';
import { DashboardPlaceholder } from './pages/DashboardPlaceholder';
import { ForbiddenPage } from './pages/ForbiddenPage';
import { SignInScreen } from './pages/SignInScreen';
import { TasksPlaceholder } from './pages/TasksPlaceholder';
import { UsersPlaceholder } from './pages/UsersPlaceholder';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/sign-in" element={<SignInScreen />} />
          <Route path="/forbidden" element={<ForbiddenPage />} />

          <Route
            element={
              <RouteGuard>
                <AppLayout />
              </RouteGuard>
            }
          >
            <Route index element={<DashboardPlaceholder />} />
            <Route path="tasks" element={<TasksPlaceholder />} />
            <Route
              path="users"
              element={
                <RouteGuard requireAdmin>
                  <UsersPlaceholder />
                </RouteGuard>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
