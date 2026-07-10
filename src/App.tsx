import { AuthProvider, useAuth } from './contexts/AuthContext';
import Dashboard from './components/Dashboard';
import LandingLogin from './components/LandingLogin';

function AuthWrapper() {
  const { user } = useAuth();
  
  if (!user) {
    return <LandingLogin />;
  }
  
  return <Dashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <AuthWrapper />
    </AuthProvider>
  );
}
