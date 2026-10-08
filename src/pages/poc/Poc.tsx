import { lazy, Suspense, useState } from 'react';

/**
 * PoC анімації (08.10.2026): одна сцена у 2.5D і 3D + звірятко зі станами.
 * Сторінка не залінкована з головної — відкривається напряму /poc.
 */
const HideSeek2D = lazy(() => import('./HideSeek2D'));
const HideSeek3D = lazy(() => import('./HideSeek3D'));
const Companion = lazy(() => import('./Companion'));

const TABS = [
  { id: '2d', label: '2.5D' },
  { id: '3d', label: '3D' },
  { id: 'pet', label: 'Звірятко' },
] as const;

export default function Poc() {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('2d');
  return (
    <div style={{ width: '100%', minHeight: '100dvh', background: 'var(--c-bg)', padding: '14px 16px 24px', fontFamily: 'var(--font-round)' }}>
      <div style={{ maxWidth: 460, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 6, background: '#fff', borderRadius: 14, padding: 4, marginBottom: 12, boxShadow: 'var(--c-shadow)' }}>
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, border: 0, borderRadius: 10, padding: '10px 0', fontFamily: 'var(--font-round)', fontWeight: 900, fontSize: 15, cursor: 'pointer', background: tab === t.id ? 'var(--c-ink)' : 'transparent', color: tab === t.id ? '#fff' : 'var(--c-mut)' }}>
              {t.label}
            </button>
          ))}
        </div>
        <Suspense fallback={<div style={{ textAlign: 'center', padding: 60, color: 'var(--c-mut)', fontWeight: 800 }}>Завантаження…</div>}>
          {tab === '2d' && <HideSeek2D />}
          {tab === '3d' && <HideSeek3D />}
          {tab === 'pet' && <Companion />}
        </Suspense>
      </div>
    </div>
  );
}
