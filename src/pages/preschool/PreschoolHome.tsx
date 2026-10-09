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
import BottomNav from './BottomNav';

/**
 * Головна дошкілля (каркас P2-swipe, рішення 08.10.2026): угорі звірятко-друг,
 * «на сьогодні» трьома великими картинками, місця по 4 на сторінці зі свайпом,
 * нижнє меню. Без вертикального скролу.
 */
type Tab = 'home' | 'friend';
const PER_PAGE = 4;
const AVATAR: Record<string, string> = {
  rabbit: '/creatures/zodiac_rabbit_wood.png',
  tiger: '/creatures/zodiac_tiger_metal.png',
  dragon: '/creatures/zodiac_dragon_fire.png',
  horse: '/creatures/zodiac_horse_water.png',
  ox: '/creatures/zodiac_ox_earth.png',
  monkey: '/creatures/zodiac_monkey_fire.png',
};

export default function PreschoolHome() {
  const navigate = useNavigate();
  const { activeProfile, profiles } = useProfileStore();
  // ?tab=friend — прийшли кнопкою «Друг» з місця чи гри
  const [tab, setTab] = useState<Tab>(() => (new URLSearchParams(window.location.search).get('tab') === 'friend' ? 'friend' : 'home'));
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
    <div style={{ width: '100%', height: '100dvh', display: 'flex', flexDirection: 'column', background: '#FFF8EE', overflow: 'hidden' }}>
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
              <div style={{ ...big, flex: 1, background: '#fff', borderRadius: 18, padding: '10px 12px', fontSize: 16, color: 'var(--c-ink)', boxShadow: '0 5px 0 #F1E3CF', position: 'relative' }}>
                {hello}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                {/* хто грає: аватарка дитини; кілька дітей — тап змінює, одна — просто показ */}
                <button onClick={profiles.length > 1 ? () => navigate('/onboarding?pick=1') : undefined} disabled={profiles.length < 2}
                  aria-label={profiles.length > 1 ? 'Змінити, хто грає' : activeProfile.nickname}
                  style={{ width: 46, height: 46, borderRadius: '50%', border: 0, padding: 2, background: '#fff', boxShadow: profiles.length > 1 ? '0 0 0 3px #F08A24, 0 4px 0 #F1E3CF' : '0 5px 0 #F1E3CF', cursor: profiles.length > 1 ? 'pointer' : 'default' }}>
                  <img src={AVATAR[activeProfile.avatar_id] ?? AVATAR.rabbit} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </button>
                <div style={{ ...big, background: '#fff', borderRadius: 99, padding: '3px 8px', fontSize: 13, boxShadow: '0 5px 0 #F1E3CF' }}>⭐ {activeProfile.total_stars}</div>
              </div>
            </div>

            {/* на сьогодні: три картки з картинками; перша — «зараз» з ▶ на ній; тап — назва голосом і гра */}
            <div style={{ background: '#FFE9D2', borderRadius: 26, padding: '8px 10px 12px', marginTop: 10, boxShadow: '0 6px 0 #F5D3AE' }}>
              <div style={{ ...big, fontSize: 13, color: '#B07A3C', margin: '0 0 6px 4px' }}>На сьогодні</div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(1, plan.length)}, 1fr)`, gap: 8 }}>
                {plan.map((s, i) => {
                  const g = getGame(s.gameId);
                  const now = i === 0;
                  return (
                    <motion.button key={s.gameId} whileTap={{ scale: 0.93 }}
                      onClick={() => { if (g) sayUk(`pre.game.${g.id}`, g.title); navigate(`/game/${s.gameId}`); }}
                      animate={now ? { y: [0, -3, 0] } : { y: 0 }} transition={now ? { duration: 2.2, repeat: Infinity, ease: 'easeInOut' } : undefined}
                      style={{ position: 'relative', aspectRatio: '1', borderRadius: 18, border: 0, padding: 4, cursor: 'pointer', background: '#fff', boxShadow: now ? '0 0 0 3px #F08A24, 0 5px 0 #F1E3CF' : '0 5px 0 #F1E3CF', display: 'grid', placeItems: 'center', minWidth: 0 }}
                      aria-label={g?.title}>
                      {g?.image
                        ? <img src={g.image} alt="" draggable={false} style={{ width: '88%', height: '88%', objectFit: 'contain', mixBlendMode: 'multiply', opacity: now ? 1 : 0.85 }} />
                        : <span style={{ fontSize: 40 }}>{g?.icon ?? '⭐'}</span>}
                      {now && (
                        <span style={{ position: 'absolute', right: 6, bottom: 6, width: 30, height: 30, borderRadius: '50%', background: '#F08A24', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 14, boxShadow: '0 3px 0 #C2620A' }}>▶</span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
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
                        style={{ border: 0, borderRadius: 26, background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, padding: 8, cursor: 'pointer', boxShadow: '0 5px 0 #F1E3CF', minHeight: 0 }}>
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
                  style={{ width: i === page ? 24 : 10, height: 10, borderRadius: 9, border: 0, padding: 0, background: i === page ? '#F08A24' : '#EED9BF', cursor: 'pointer', transition: 'width .2s' }} />
              ))}
            </div>
          </>
        )}
      </div>

      <BottomNav active={tab} onHome={() => setTab('home')} onFriend={() => setTab('friend')} />
    </div>
  );
}
