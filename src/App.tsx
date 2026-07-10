import { AuthProvider } from './contexts/AuthContext';
import Dashboard from './components/Dashboard';

export default function App() {
  return (
    <AuthProvider>
      <Dashboard />
    </AuthProvider>
  );
}
