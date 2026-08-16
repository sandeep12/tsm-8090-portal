import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { AppLayout } from './components/AppLayout';
import { RouteGuard } from './components/RouteGuard';
import { DashboardScreen } from './pages/DashboardScreen';
import { ForbiddenPage } from './pages/ForbiddenPage';
import { SignInScreen } from './pages/SignInScreen';
import { TaskDetailScreen } from './pages/tasks/TaskDetailScreen';
import { TaskFormScreen } from './pages/tasks/TaskFormScreen';
import { TaskListScreen } from './pages/tasks/TaskListScreen';
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
            <Route index element={<DashboardScreen />} />
            <Route path="tasks" element={<TaskListScreen />} />
            <Route path="tasks/new" element={<TaskFormScreen />} />
            <Route path="tasks/:id/edit" element={<TaskFormScreen />} />
            <Route path="tasks/:id" element={<TaskDetailScreen />} />
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
