import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfileStore } from '@/stores/useProfileStore';
import { profileClass } from '@/games/registry';
import type { ClassLevel } from '@/games/types';

/**
 * Панель розробника — КАРТА ЕКРАНІВ по ролях: Вхід · Батьки · Дитина.
 * Кожен пункт відкриває екран у потрібному стані (з потрібною дитиною).
 * Правило: зʼявився новий екран — додаємо сюди рядок.
 * Живе лише в `vite dev` (import.meta.env.DEV) — у прод не збирається.
 */
type Item = { label: string; to: string; kid?: ClassLevel };
// лише пропрацьовані екрани (09.10); нове — додаємо після того, як пройшли його з Тарасом
const MAP: { title: string; items: Item[] }[] = [
  {
    title: 'Вхід',
    items: [
      { label: 'Вхід (Google · код · без акаунта)', to: '/?login=1' },
      { label: 'Вхід поштою', to: '/?login=1&sheet=mail' },
      { label: 'Реєстрація', to: '/?login=1&sheet=signup' },
    ],
  },
  {
    title: 'Батьки',
    items: [
      { label: 'Батькам — дашборд', to: '/parents' },
      { label: 'Додати дитину', to: '/?add=1' },
    ],
  },
  {
    title: 'Дитина (дошкілля)',
    items: [
      { label: 'Хто грає?', to: '/onboarding?pick=1' },
      { label: 'Головна', to: '/hub', kid: 'preschool' },
      { label: '🔤 Острів Слів', to: '/place/island', kid: 'preschool' },
      { label: '🔤 Острів Слів · English', to: '/place/island?lang=en', kid: 'preschool' },
    ],
  },
];

/** Тестова родина під склад сімʼї Тараса. */
const FAMILY: [string, ClassLevel, '5-6' | '6-7' | '7-8', string][] = [
  ['Дарина', 'preschool', '5-6', 'rabbit'],
  ['Марія', 'grade1', '6-7', 'tiger'],
  ['Соломія', 'grade2', '7-8', 'dragon'],
  ['Емілія', 'grade3', '7-8', 'horse'],
];

const btn = { border: 0, borderRadius: 10, padding: '7px 10px', fontSize: 13, fontWeight: 800, cursor: 'pointer', background: '#F1EEFF', color: '#4c1d95', textAlign: 'left' } as const;
const head = { fontSize: 11, fontWeight: 900, color: '#999', margin: '6px 2px 0', textTransform: 'uppercase', letterSpacing: 0.5 } as const;

export default function DevNav() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const go = (it: Item) => {
    setOpen(false);
    if (it.kid) {
      // потрібна дитина цього віку — обираємо її (або підказуємо створити родину)
      const st = useProfileStore.getState();
      const p = st.profiles.find((x) => profileClass(x) === it.kid);
      if (!p) {
        alert('Немає дитини цього віку — натисни «Тестова родина»');
        return;
      }
      st.selectProfile(p.id);
    }
    navigate(it.to);
  };

  const reset = () => {
    try {
      localStorage.clear();
    } catch {
      // нема доступу — не страшно
    }
    location.href = '/?login=1';
  };

  const seed = async () => {
    const st = useProfileStore.getState();
    for (const [name, cl, age, av] of FAMILY) {
      if (!useProfileStore.getState().profiles.some((p) => p.nickname === name)) await st.createProfile(name, age, av, undefined, cl);
    }
    setOpen(false);
    navigate('/onboarding?pick=1');
  };

  return (
    <div style={{ position: 'fixed', left: 8, bottom: 78, zIndex: 9999, fontFamily: 'system-ui, sans-serif' }}>
      {open && (
        <div style={{ position: 'absolute', left: 0, bottom: 44, width: 240, maxHeight: '80dvh', overflowY: 'auto', background: '#fff', borderRadius: 14, boxShadow: '0 8px 30px #0003', padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            <button style={{ ...btn, background: '#FFE3EC', color: '#9d174d' }} onClick={reset}>⟲ Скинути все</button>
            <button style={{ ...btn, background: '#DFF7E6', color: '#166534' }} onClick={seed}>👪 Тестова родина</button>
          </div>
          {MAP.map((g) => (
            <div key={g.title} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={head}>{g.title}</div>
              {g.items.map((it) => <button key={it.label} style={btn} onClick={() => go(it)}>{it.label}</button>)}
            </div>
          ))}
        </div>
      )}
      <button onClick={() => setOpen(!open)} aria-label="Карта екранів"
        style={{ width: 38, height: 38, borderRadius: '50%', border: 0, background: '#1F2138', color: '#fff', fontSize: 12, fontWeight: 900, cursor: 'pointer', opacity: open ? 1 : 0.55 }}>
        DEV
      </button>
    </div>
  );
}
