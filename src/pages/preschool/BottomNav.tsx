import { useNavigate } from 'react-router-dom';

/**
 * Нижнє меню дошкілля — однакове на головній, у місцях і в іграх (рішення 09.10.2026).
 * Плаваюча біла панель, у кожного пункту свій кольоровий кружечок; активний — кольоровий підпис і більший кружечок.
 * Дім → головна · Друг → вкладка друга на головній · Батькам → дашборд батьків.
 */
export type NavTab = 'home' | 'friend' | null;

const ITEMS = [
  { k: 'home', icon: '🏠', label: 'Дім', bg: '#FFE0C7', ink: '#C2620A' },
  { k: 'friend', icon: '🐰', label: 'Друг', bg: '#CFF2DA', ink: '#1E7A3A' },
  { k: 'parents', icon: '👪', label: 'Батькам', bg: '#E4DBFF', ink: '#6D28D9' },
] as const;

export default function BottomNav({ active = null, onHome, onFriend }: { active?: NavTab; onHome?: () => void; onFriend?: () => void }) {
  const navigate = useNavigate();
  const go = { home: onHome ?? (() => navigate('/hub')), friend: onFriend ?? (() => navigate('/hub?tab=friend')), parents: () => navigate('/parents') };
  return (
    <nav style={{ position: 'relative', zIndex: 2, padding: '0 12px calc(10px + env(safe-area-inset-bottom))' }}>
      <div style={{ display: 'flex', background: '#fff', borderRadius: 26, boxShadow: '0 6px 20px rgba(60,40,120,.14)', padding: '6px 6px' }}>
        {ITEMS.map((it) => {
          const on = active === it.k;
          return (
            <button key={it.k} onClick={go[it.k]} aria-current={on ? 'page' : undefined}
              style={{ flex: 1, border: 0, background: on ? it.bg : 'transparent', borderRadius: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '6px 0', fontFamily: 'var(--font-round)', fontWeight: 900, fontSize: 12, color: on ? it.ink : '#7A7D99', cursor: 'pointer', transition: 'background .2s' }}>
              <span style={{ width: on ? 38 : 34, height: on ? 38 : 34, borderRadius: '50%', background: on ? '#fff' : it.bg, display: 'grid', placeItems: 'center', fontSize: on ? 22 : 19, transition: 'all .2s' }}>{it.icon}</span>
              {it.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
