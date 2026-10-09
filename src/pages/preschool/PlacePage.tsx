import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { getGame } from '@/games/registry';
import { sayUk } from '@/games/shared/uk-audio';
import { getPlace } from './places';

/**
 * Місце дошкілля: ігри великими картинками, по 6 на сторінці зі свайпом (без скролу).
 * Тап по картинці — спершу звучить назва, другий тап — гра.
 */
const PER_PAGE = 6;

export default function PlacePage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const place = getPlace(id);
  const [page, setPage] = useState(0);
  const [armed, setArmed] = useState<string | null>(null);
  const [x0, setX0] = useState<number | null>(null);

  useEffect(() => { if (place) sayUk(`pre.hello.${place.id}`, place.hello); }, [place]);
  if (!place) return null;

  const games = place.games.map(getGame).filter(Boolean);
  const pages = Array.from({ length: Math.max(1, Math.ceil(games.length / PER_PAGE)) }, (_, i) => games.slice(i * PER_PAGE, i * PER_PAGE + PER_PAGE));
  const big = { fontFamily: 'var(--font-round)', fontWeight: 900 } as const;

  const tap = (gid: string, title: string) => {
    if (armed === gid) { navigate(`/game/${gid}`); return; }
    setArmed(gid);
    sayUk(`pre.game.${gid}`, title);
  };

  return (
    <div style={{ width: '100%', height: '100dvh', display: 'flex', flexDirection: 'column', background: place.bg, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px 6px', maxWidth: 520, width: '100%', margin: '0 auto' }}>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/hub')} aria-label="Додому"
          style={{ width: 52, height: 52, borderRadius: '50%', border: 0, background: '#fff', fontSize: 26, boxShadow: 'var(--c-shadow)', cursor: 'pointer' }}>🏠</motion.button>
        <div style={{ ...big, flex: 1, fontSize: 20, color: 'var(--c-ink)' }}>{place.title}</div>
        {place.image ? <img src={place.image} alt="" style={{ width: 56, height: 56, objectFit: 'contain', mixBlendMode: 'multiply' }} /> : <span style={{ fontSize: 40 }}>{place.emoji}</span>}
      </div>

      {games.length === 0 ? (
        <div style={{ ...big, flex: 1, display: 'grid', placeItems: 'center', textAlign: 'center', padding: 24, fontSize: 20, color: 'var(--c-ink)', opacity: 0.7 }}>
          <div><div style={{ fontSize: 80 }}>{place.emoji}</div>{place.hello}</div>
        </div>
      ) : (
        <div
          style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: '8px 0', maxWidth: 520, width: '100%', margin: '0 auto', touchAction: 'pan-y' }}
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
              <div key={i} style={{ flex: 'none', width: '100%', height: '100%', boxSizing: 'border-box', padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'repeat(3, 1fr)', gap: 12 }}>
                {pg.map((g) => g && (
                  <motion.button key={g.id} whileTap={{ scale: 0.94 }} onClick={() => tap(g.id, g.title)}
                    animate={armed === g.id ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                    style={{ border: armed === g.id ? '4px solid var(--c-primary)' : '4px solid transparent', borderRadius: 24, background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer', boxShadow: 'var(--c-shadow)', minHeight: 0 }}>
                    {g.image
                      ? <img src={g.image} alt="" draggable={false} style={{ width: '78%', flex: 1, minHeight: 0, objectFit: 'contain', mixBlendMode: 'multiply' }} />
                      : <span style={{ fontSize: 52, lineHeight: 1 }}>{g.icon}</span>}
                    <span style={{ ...big, fontSize: 13, color: 'var(--c-ink)', opacity: 0.6, textAlign: 'center', padding: '0 6px' }}>{g.title}</span>
                    {armed === g.id && <span style={{ ...big, fontSize: 12, color: 'var(--c-primary)' }}>▶ ще раз — граємо</span>}
                  </motion.button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
      {pages.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '6px 0 calc(14px + env(safe-area-inset-bottom))' }}>
          {pages.map((_, i) => (
            <button key={i} onClick={() => setPage(i)} aria-label={`Сторінка ${i + 1}`}
              style={{ width: i === page ? 24 : 10, height: 10, borderRadius: 9, border: 0, padding: 0, background: i === page ? 'var(--c-primary)' : 'rgba(0,0,0,.15)', cursor: 'pointer' }} />
          ))}
        </div>
      )}
    </div>
  );
}
