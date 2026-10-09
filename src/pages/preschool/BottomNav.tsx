import { useNavigate } from 'react-router-dom';

/**
 * Нижнє меню дошкілля — однакове на головній, у місцях і в іграх (рішення 09.10.2026).
 * Дім → головна · Друг → вкладка друга на головній · Батькам → дашборд батьків.
 */
export type NavTab = 'home' | 'friend' | null;

export default function BottomNav({ active = null, onHome, onFriend }: { active?: NavTab; onHome?: () => void; onFriend?: () => void }) {
  const navigate = useNavigate();
  const items: [Exclude<NavTab, null> | 'parents', string, string, () => void][] = [
    ['home', '🏠', 'Дім', onHome ?? (() => navigate('/hub'))],
    ['friend', '🐰', 'Друг', onFriend ?? (() => navigate('/hub?tab=friend'))],
    ['parents', '👪', 'Батькам', () => navigate('/parents')],
  ];
  return (
    <nav style={{ position: 'relative', zIndex: 2, display: 'flex', background: '#fff', borderTop: '1px solid var(--c-line)', padding: '6px 4px calc(8px + env(safe-area-inset-bottom))' }}>
      {items.map(([k, e, l, go]) => (
        <button key={k} onClick={go}
          style={{ flex: 1, border: 0, background: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, fontSize: 12, padding: '4px 0', fontFamily: 'var(--font-round)', fontWeight: 900, color: active === k ? 'var(--c-primary)' : 'var(--c-mut)', cursor: 'pointer' }}>
          <span style={{ fontSize: 24, filter: active === k || k === 'parents' ? 'none' : 'grayscale(1)', opacity: active === k ? 1 : 0.6 }}>{e}</span>
          {l}
        </button>
      ))}
    </nav>
  );
}
