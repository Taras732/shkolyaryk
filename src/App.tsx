import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Welcome from '@/pages/Welcome';
import Auth from '@/pages/Auth';
import Onboarding from '@/pages/Onboarding';
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
        {/* Phone Notch/Status Bar Simulation */}
        <div style={{
          height: '24px',
          background: 'var(--text-dark)',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          zIndex: 10
        }}>
          <div style={{
            width: '120px',
            height: '14px',
            background: '#000',
            borderBottomLeftRadius: '10px',
            borderBottomRightRadius: '10px'
          }} />
        </div>

        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/hub" element={<Hub />} />
          <Route path="/parent" element={<ParentDashboard />} />
          <Route path="/game/:id" element={<GamePlayer />} />
        </Routes>
      </div>
    </Router>
  );
}
