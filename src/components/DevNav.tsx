import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PLACES } from '@/pages/preschool/places';

/**
 * Панель розробника: перехід на будь-який екран і скидання стану одним кліком.
 * Живе лише в `vite dev` (import.meta.env.DEV) — у збірку для проду не потрапляє.
 */
const LINKS: [string, string][] = [
  ['Старт', '/'],
  ['Хто грає', '/onboarding?pick=1'],
  ['Батькам (дашборд)', '/parents'],
  ['Додати дитину', '/?add=1'],
  ['Вхід як новий пристрій', '/?login=1'],
  ['Головна', '/hub'],
  ['Для батьків', '/family'],
  ['Мій день', '/day'],
  ['Гра: знайди букву', '/game/letters-find'],
  ['Гра: знайди цифру', '/game/recognize-digit'],
  ['PoC', '/poc'],
];

const btn = { border: 0, borderRadius: 10, padding: '7px 10px', fontSize: 13, fontWeight: 800, cursor: 'pointer', background: '#F1EEFF', color: '#4c1d95', textAlign: 'left' } as const;

export default function DevNav() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };
  const reset = () => {
    try {
      localStorage.clear();
    } catch {
      // нема доступу — не страшно
    }
    location.href = '/';
  };

  return (
    <div style={{ position: 'fixed', right: 8, top: 8, zIndex: 9999, fontFamily: 'system-ui, sans-serif' }}>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: 44, width: 210, maxHeight: '70dvh', overflowY: 'auto', background: '#fff', borderRadius: 14, boxShadow: '0 8px 30px #0003', padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button style={{ ...btn, background: '#FFE3EC', color: '#9d174d' }} onClick={reset}>⟲ Скинути все (перший вхід)</button>
          {LINKS.map(([l, to]) => <button key={to} style={btn} onClick={() => go(to)}>{l}</button>)}
          <div style={{ fontSize: 11, fontWeight: 800, color: '#999', margin: '4px 2px 0' }}>Місця</div>
          {PLACES.map((p) => <button key={p.id} style={btn} onClick={() => go(`/place/${p.id}`)}>{p.emoji} {p.title}</button>)}
        </div>
      )}
      <button onClick={() => setOpen(!open)} aria-label="Панель розробника"
        style={{ width: 38, height: 38, borderRadius: '50%', border: 0, background: '#1F2138', color: '#fff', fontSize: 12, fontWeight: 900, cursor: 'pointer', opacity: open ? 1 : 0.55 }}>
        DEV
      </button>
    </div>
  );
}
