import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useProfileStore } from '@/stores/useProfileStore';
import { getGame } from '@/games/registry';
import { resolvePlan } from '@/school/plan-resolve';
import { sayUk } from '@/games/shared/uk-audio';
import PuppetBunny from '@/pages/poc/PuppetBunny';
import Companion from '@/pages/poc/Companion';
import type { Face } from '@/pages/poc/Bunny';
import { PLACES } from './places';

/**
 * Головна дошкілля (каркас P2-swipe, рішення 08.10.2026): угорі звірятко-друг,
 * «на сьогодні» трьома великими картинками, місця по 4 на сторінці зі свайпом,
 * нижнє меню. Без вертикального скролу.
 */
type Tab = 'home' | 'friend';
const PER_PAGE = 4;

export default function PreschoolHome() {
  const navigate = useNavigate();
  const { activeProfile } = useProfileStore();
  const [tab, setTab] = useState<Tab>('home');
  const [page, setPage] = useState(0);
  const [face, setFace] = useState<Face>('smile');
  const [bounce, setBounce] = useState(0);
  const [x0, setX0] = useState<number | null>(null);
  if (!activeProfile) return null;

  const plan = resolvePlan(activeProfile).slice(0, 3);
  const pages = Array.from({ length: Math.ceil(PLACES.length / PER_PAGE) }, (_, i) => PLACES.slice(i * PER_PAGE, i * PER_PAGE + PER_PAGE));
  // без імені: кличний відмінок («Маріє») автоматично не утворити
  const hello = 'Привіт! Пограємо?';

  const poke = () => {
    setFace('happy');
    setBounce((b) => b + 1);
    sayUk('pre.hello', hello);
    setTimeout(() => setFace('smile'), 1400);
  };

  const big = { fontFamily: 'var(--font-round)', fontWeight: 900 } as const;

  return (
    <div style={{ width: '100%', height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--c-bg)', overflow: 'hidden' }}>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: '10px 16px 8px', maxWidth: 520, width: '100%', margin: '0 auto' }}>
        {tab === 'friend' ? (
          <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center' }}><Companion /></div>
        ) : (
          <>
            {/* звірятко + привітання */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 92, flex: 'none' }}>
                <PuppetBunny face={face} bounce={bounce} onZone={poke} />
              </div>
              <div style={{ ...big, flex: 1, background: '#fff', borderRadius: 18, padding: '10px 12px', fontSize: 16, color: 'var(--c-ink)', boxShadow: 'var(--c-shadow)', position: 'relative' }}>
                {hello}
              </div>
              <div style={{ ...big, background: '#fff', borderRadius: 99, padding: '6px 10px', fontSize: 15, boxShadow: 'var(--c-shadow)' }}>⭐ {activeProfile.total_stars}</div>
            </div>

            {/* на сьогодні */}
            <div style={{ background: 'var(--c-primary)', borderRadius: 22, padding: 10, marginTop: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(1, plan.length)}, 1fr)`, gap: 8 }}>
                {plan.map((s, i) => {
                  const g = getGame(s.gameId);
                  return (
                    <motion.button key={s.gameId} whileTap={{ scale: 0.92 }} onClick={() => navigate(`/game/${s.gameId}`)}
                      style={{ aspectRatio: '1.25', borderRadius: 18, border: 0, background: i === 0 ? '#fff' : 'rgba(255,255,255,.18)', fontSize: 40, cursor: 'pointer', boxShadow: i === 0 ? '0 0 0 4px rgba(255,255,255,.35)' : 'none' }}
                      aria-label={g?.title}>
                      {g?.icon ?? '⭐'}
                    </motion.button>
                  );
                })}
              </div>
              {plan[0] && (
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate(`/game/${plan[0].gameId}`)}
                  style={{ ...big, width: '100%', marginTop: 8, border: 0, borderRadius: 16, padding: '10px 0', background: '#fff', color: 'var(--c-primary)', fontSize: 24, cursor: 'pointer' }}>
                  ▶
                </motion.button>
              )}
            </div>

            {/* місця: свайп по 4 */}
            <div
              style={{ flex: 1, minHeight: 0, overflow: 'hidden', marginTop: 10, touchAction: 'pan-y' }}
              onPointerDown={(e) => setX0(e.clientX)}
              onPointerUp={(e) => {
                if (x0 === null) return;
                const dx = e.clientX - x0;
                setX0(null);
                if (Math.abs(dx) > 40) setPage((p) => Math.max(0, Math.min(pages.length - 1, p + (dx < 0 ? 1 : -1))));
              }}
            >
              <div style={{ display: 'flex', height: '100%', transform: `translateX(${-page * 100}%)`, transition: 'transform .35s cubic-bezier(.3,.7,.3,1)' }}>
                {pages.map((pg, i) => (
                  <div key={i} style={{ flex: 'none', width: '100%', height: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 10, paddingRight: 1 }}>
                    {pg.map((p) => (
                      <motion.button key={p.id} whileTap={{ scale: 0.95 }}
                        onClick={() => { sayUk(`pre.place.${p.id}`, p.title); navigate(`/place/${p.id}`); }}
                        style={{ border: 0, borderRadius: 24, background: p.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, padding: 8, cursor: 'pointer', boxShadow: 'var(--c-shadow)', minHeight: 0 }}>
                        {p.image
                          ? <img src={p.image} alt="" draggable={false} style={{ width: '80%', flex: 1, minHeight: 0, objectFit: 'contain', mixBlendMode: 'multiply', borderRadius: 16 }} />
                          : <span style={{ fontSize: 56, flex: 1, display: 'grid', placeItems: 'center' }}>{p.emoji}</span>}
                        <span style={{ ...big, fontSize: 14, color: 'var(--c-ink)', opacity: 0.7 }}>{p.title}</span>
                      </motion.button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, paddingTop: 8 }}>
              {pages.map((_, i) => (
                <button key={i} onClick={() => setPage(i)} aria-label={`Сторінка ${i + 1}`}
                  style={{ width: i === page ? 24 : 10, height: 10, borderRadius: 9, border: 0, padding: 0, background: i === page ? 'var(--c-primary)' : 'var(--c-line)', cursor: 'pointer', transition: 'width .2s' }} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* нижнє меню */}
      <nav style={{ display: 'flex', background: '#fff', borderTop: '1px solid var(--c-line)', padding: '6px 4px calc(8px + env(safe-area-inset-bottom))' }}>
        {([['home', '🏠', 'Дім'], ['friend', '🐰', 'Друг'], ['parents', '👪', 'Батькам']] as const).map(([k, e, l]) => (
          <button key={k} onClick={() => (k === 'parents' ? navigate('/family') : setTab(k))}
            style={{ ...big, flex: 1, border: 0, background: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, fontSize: 12, padding: '4px 0', color: tab === k ? 'var(--c-primary)' : 'var(--c-mut)', cursor: 'pointer' }}>
            <span style={{ fontSize: 24, filter: tab === k || k === 'parents' ? 'none' : 'grayscale(1)', opacity: tab === k ? 1 : 0.6 }}>{e}</span>
            {l}
          </button>
        ))}
      </nav>
    </div>
  );
}
