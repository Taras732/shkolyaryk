import { useNavigate } from 'react-router-dom';
import { usePet } from '@/pets/pets';

/**
 * Нижнє меню дошкілля (концепт B2, 09.10.2026) — на головній і в місцях; у грі меню немає.
 * Біла панель з «підставкою» тону тла; активний пункт — персикова пігулка.
 * Дім → головна · Друг → вкладка друга на головній · Батькам → дашборд батьків.
 */
export type NavTab = 'home' | 'friend' | null;

const ITEMS = [
  { k: 'home', icon: '🏠', label: 'Дім' },
  { k: 'friend', icon: '🐰', label: 'Друг' },
  { k: 'parents', icon: '👪', label: 'Батькам' },
] as const;

export default function BottomNav({ active = null, onHome, onFriend }: { active?: NavTab; onHome?: () => void; onFriend?: () => void }) {
  const navigate = useNavigate();
  const pet = usePet(); // «Друг» — обличчя свого звірятка, а не завжди зайчик
  const go = { home: onHome ?? (() => navigate('/hub')), friend: onFriend ?? (() => navigate('/hub?tab=friend')), parents: () => navigate('/parents') };
  return (
    <nav style={{ position: 'relative', zIndex: 2, padding: '6px 14px calc(12px + env(safe-area-inset-bottom))' }}>
      <div style={{ display: 'flex', gap: 4, background: '#fff', borderRadius: 26, boxShadow: '0 5px 0 #F1E3CF', padding: 6 }}>
        {ITEMS.map((it) => {
          const on = active === it.k;
          return (
            <button key={it.k} onClick={go[it.k]} aria-current={on ? 'page' : undefined}
              style={{ flex: 1, border: 0, borderRadius: 20, background: on ? '#FFE7CF' : 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, height: 56, fontFamily: 'var(--font-round)', fontWeight: 900, fontSize: 12, color: on ? '#C2620A' : '#B9A88F', cursor: 'pointer' }}>
              {it.k === 'friend'
                ? <img src={pet.img} alt="" draggable={false} style={{ height: 28, width: 28, objectFit: 'contain' }} />
                : <span style={{ fontSize: 22, lineHeight: '26px', height: 26 }}>{it.icon}</span>}
              <span style={{ lineHeight: '14px' }}>{it.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
