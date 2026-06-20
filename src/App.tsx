import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Welcome from '@/pages/Welcome';
import Auth from '@/pages/Auth';
import Onboarding from '@/pages/Onboarding';
import RoleSelect from '@/pages/RoleSelect';
import Hub from '@/pages/Hub';
import ParentDashboard from '@/pages/ParentDashboard';
import GamePlayer from '@/pages/GamePlayer';
import { useAuthStore } from '@/stores/useAuthStore';

export default function App() {
  const initializeAuth = useAuthStore(state => state.initialize);

  // Initialize Auth state listeners on App mount
  useEffect(() => {
    const unsubscribe = initializeAuth();
    return () => unsubscribe();
  }, [initializeAuth]);

  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/role" element={<RoleSelect />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/hub" element={<Hub />} />
          <Route path="/parent" element={<ParentDashboard />} />
          <Route path="/game/:id" element={<GamePlayer />} />
        </Routes>
      </div>
    </Router>
  );
}
