import RouteErrorBoundary from './components/common/RouteErrorBoundary';
import type { ComponentType } from 'react';
import AccountsRoute from './routes/AccountsRoute';
import DashboardRoute from './routes/DashboardRoute';
import ExportRoute from './routes/ExportRoute';
import ImportRoute from './routes/ImportRoute';
import LoginRoute from './routes/LoginRoute';
import NotFoundRoute from './routes/NotFoundRoute';
import RootRoute from './routes/RootRoute';
import ScoresRoute from './routes/ScoresRoute';
import SettingsRoute from './routes/SettingsRoute';
import StudentsRoute from './routes/StudentsRoute';
import { useCurrentPath } from './lib/router';

const routes: Record<string, ComponentType> = {
  '/': RootRoute,
  '/login': LoginRoute,
  '/dashboard': DashboardRoute,
  '/scores': ScoresRoute,
  '/students': StudentsRoute,
  '/import': ImportRoute,
  '/export': ExportRoute,
  '/accounts': AccountsRoute,
  '/settings': SettingsRoute,
};

export default function App() {
  const currentPath = useCurrentPath();
  const RouteComponent = routes[currentPath] ?? NotFoundRoute;

  return (
    <RouteErrorBoundary>
      <RouteComponent />
    </RouteErrorBoundary>
  );
}
