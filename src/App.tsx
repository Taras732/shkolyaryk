import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Welcome from '@/pages/Welcome';
import Auth from '@/pages/Auth';
import Onboarding from '@/pages/Onboarding';
import RoleSelect from '@/pages/RoleSelect';
import Hub from '@/pages/Hub';
import ParentDashboard from '@/pages/ParentDashboard';
import GamePlayer from '@/pages/GamePlayer';
import RuleLessonPlayer from '@/pages/RuleLessonPlayer';
import Placement from '@/pages/Placement';
import DayPlan from '@/pages/DayPlan';
import AfterSchool from './pages/AfterSchool';
import Homework from './pages/Homework';
import Family from './pages/Family';
import Sheet from './pages/Sheet';
import { useAuthStore } from '@/stores/useAuthStore';

const Poc = lazy(() => import('./pages/poc/Poc'));
const PlacePage = lazy(() => import('./pages/preschool/PlacePage'));
import { runFamilySync } from '@/school/family-sync-run';

// Легасі-сторінки (Welcome/Auth/Onboarding/...) поки в телефонній рамці.
function PhoneFrame({ children }: { children: ReactNode }) {
  return <div className="app-container">{children}</div>;
}

// Ігрова частина — повноцінний веб-застосунок, адаптивний під мобілку.
function WebShell({ children }: { children: ReactNode }) {
  return <div className="web-shell">{children}</div>;
}

export default function App() {
  const initializeAuth = useAuthStore((state) => state.initialize);

  // прогрес дітей між пристроями сім'ї: на старті і коли застосунок знову стає видимим
  useEffect(() => {
    void runFamilySync();
    const onVisible = () => document.visibilityState === 'visible' && void runFamilySync();
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  useEffect(() => {
    const unsubscribe = initializeAuth();
    return () => unsubscribe();
  }, [initializeAuth]);

  return (
    <Router>
      <Routes>
        {/* Вхід у продукт: Welcome → Auth → RoleSelect → Onboarding → Placement → Hub. */}
        <Route path="/" element={<PhoneFrame><Welcome /></PhoneFrame>} />
        <Route path="/welcome" element={<Navigate to="/" replace />} />
        <Route path="/auth" element={<PhoneFrame><Auth /></PhoneFrame>} />
        <Route path="/role" element={<PhoneFrame><RoleSelect /></PhoneFrame>} />
        <Route path="/onboarding" element={<PhoneFrame><Onboarding /></PhoneFrame>} />
        {/* S1: кабінет батьків — веб-SaaS layout, як Hub/GamePlayer, а не телефонна рамка. */}
        <Route path="/parent" element={<WebShell><ParentDashboard /></WebShell>} />
        <Route path="/hub" element={<WebShell><Hub /></WebShell>} />
        <Route path="/placement" element={<WebShell><Placement /></WebShell>} />
        <Route path="/day" element={<WebShell><DayPlan /></WebShell>} />
        <Route path="/after-school" element={<WebShell><AfterSchool /></WebShell>} />
        <Route path="/homework" element={<WebShell><Homework /></WebShell>} />
        <Route path="/family" element={<WebShell><Family /></WebShell>} />
        <Route path="/sheet/:id" element={<WebShell><Sheet /></WebShell>} />
        <Route path="/game/:id" element={<WebShell><GamePlayer /></WebShell>} />
        {/* RL1 — движок «Правило» (Direct Instruction). Крок «Правило дня» у /day прийде окремо (Фаза 2). */}
        <Route path="/rule/:id" element={<WebShell><RuleLessonPlayer /></WebShell>} />
        {/* Місце дошкілля (кімната з іграми). */}
        <Route path="/place/:id" element={<WebShell><Suspense fallback={null}><PlacePage /></Suspense></WebShell>} />
        {/* PoC анімації — лише за прямим посиланням, окремим чанком. */}
        <Route path="/poc" element={<WebShell><Suspense fallback={null}><Poc /></Suspense></WebShell>} />
        {/* Невідомий URL → на головну (без білого екрана). */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
