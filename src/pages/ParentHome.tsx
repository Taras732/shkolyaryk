import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useProfileStore } from '@/stores/useProfileStore';
import { getGame, profileClass } from '@/games/registry';
import { CLASS_META } from '@/games/types';

/**
 * «Батькам» — дашборд батьків (рішення 09.10.2026).
 *  - немає дітей → зверху підсвічена картка «Додай дитину»;
 *  - кілька дітей → перемикач випадаючим списком;
 *  - по обраній дитині: зірочки, ігри, останні результати;
 *  - «Підключити пристрій» → одноразовий код на 15 хв, копіювати / поділитися.
 * TODO(supabase): код зараз живе лише на цьому пристрої — звірки на сервері ще немає.
 */
const AVATAR: Record<string, string> = {
  rabbit: '/creatures/zodiac_rabbit_wood.png',
  tiger: '/creatures/zodiac_tiger_metal.png',
  dragon: '/creatures/zodiac_dragon_fire.png',
  horse: '/creatures/zodiac_horse_water.png',
  ox: '/creatures/zodiac_ox_earth.png',
  monkey: '/creatures/zodiac_monkey_fire.png',
};
const CODE_TTL_MS = 15 * 60 * 1000;
const SKY = 'linear-gradient(180deg, #BFE3FF 0%, #DDEFFF 40%, #F3EEFF 100%)';
const big = { fontFamily: 'var(--font-round)', fontWeight: 900 } as const;
const card = { background: '#fff', borderRadius: 24, boxShadow: 'var(--c-shadow)' } as const;
const primary = { ...big, border: 0, borderRadius: 20, padding: '14px 0', fontSize: 17, background: 'var(--c-primary)', color: '#fff', cursor: 'pointer', width: '100%' } as const;
const soft = { ...big, border: 0, borderRadius: 16, padding: '12px 0', fontSize: 15, background: 'var(--c-bg)', color: 'var(--c-primary)', cursor: 'pointer' } as const;

function newCode(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
  return String(n).padStart(6, '0');
}

export default function ParentHome() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { profiles, progress, loadProfiles } = useProfileStore();
  const params = new URLSearchParams(window.location.search);
  const [childId, setChildId] = useState<string | null>(params.get('code') ?? null);
  const [code, setCode] = useState<{ value: string; until: number } | null>(null);
  const [now, setNow] = useState(Date.now());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadProfiles(user?.id);
  }, [user, loadProfiles]);

  const child = profiles.find((p) => p.id === childId) ?? profiles[0] ?? null;

  // щойно додали дитину (?code=<id>) — одразу показати код для неї
  useEffect(() => {
    if (params.get('code') && child && !code) setCode({ value: newCode(), until: Date.now() + CODE_TTL_MS });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [child?.id]);

  useEffect(() => {
    if (!code) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [code]);

  const stats = useMemo(() => {
    const games = child ? Object.values(progress[child.id] ?? {}) : [];
    const recent = [...games].sort((a, b) => (b.updated_at ?? '').localeCompare(a.updated_at ?? '')).slice(0, 4);
    return { played: games.length, recent };
  }, [child, progress]);

  const left = code ? Math.max(0, code.until - now) : 0;
  const mmss = `${Math.floor(left / 60000)}:${String(Math.floor((left % 60000) / 1000)).padStart(2, '0')}`;
  const shareText = child && code ? `Школярик (${child.nickname}) — код для входу: ${code.value}. Діє 15 хвилин. Відкрий shkolyaryk.kuznya.studio і введи код.` : '';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code?.value ?? '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // буфер недоступний — код і так видно на екрані
    }
  };
  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Школярик', text: shareText });
      } catch {
        // користувач закрив вікно «Поділитися»
      }
    } else copy();
  };

  return (
    <div style={{ width: '100%', minHeight: '100dvh', background: SKY }}>
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '14px 16px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => navigate('/hub')} aria-label="Назад" style={{ ...big, border: 0, background: 'none', fontSize: 22, color: 'var(--c-mut)', cursor: 'pointer' }}>←</button>
          <div style={{ ...big, fontSize: 24, color: 'var(--c-ink)', flex: 1 }}>Батькам</div>
        </div>

        {/* немає дітей — головна дія підсвічена */}
        {profiles.length === 0 && (
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/?add=1')}
            animate={{ boxShadow: ['0 0 0 0 rgba(124,58,237,.45)', '0 0 0 12px rgba(124,58,237,0)'] }} transition={{ duration: 1.6, repeat: Infinity }}
            style={{ ...big, border: 0, borderRadius: 24, background: 'var(--c-primary)', color: '#fff', padding: '22px 16px', fontSize: 20, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 34 }}>＋</span>
            <span>Додай дитину<br /><span style={{ fontSize: 13, opacity: 0.85 }}>імʼя, садок чи клас, друг — і готово</span></span>
          </motion.button>
        )}

        {child && (
          <>
            {/* перемикач дітей */}
            <div style={{ ...card, padding: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
              <img src={AVATAR[child.avatar_id] ?? AVATAR.rabbit} alt="" style={{ width: 52, height: 52, objectFit: 'contain' }} />
              {profiles.length > 1 ? (
                <select value={child.id} onChange={(e) => { setChildId(e.target.value); setCode(null); }}
                  style={{ ...big, flex: 1, fontSize: 20, border: 0, background: 'transparent', color: 'var(--c-ink)', cursor: 'pointer', outline: 'none' }}>
                  {profiles.map((p) => <option key={p.id} value={p.id}>{p.nickname}</option>)}
                </select>
              ) : (
                <div style={{ ...big, flex: 1, fontSize: 20, color: 'var(--c-ink)' }}>{child.nickname}</div>
              )}
              <span style={{ ...big, fontSize: 13, color: 'var(--c-mut)' }}>{CLASS_META[profileClass(child)].short}</span>
            </div>

            {/* результати */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ ...card, padding: 14, textAlign: 'center' }}>
                <div style={{ ...big, fontSize: 30, color: 'var(--c-ink)' }}>⭐ {child.total_stars}</div>
                <div style={{ ...big, fontSize: 12, color: 'var(--c-mut)' }}>зірочок</div>
              </div>
              <div style={{ ...card, padding: 14, textAlign: 'center' }}>
                <div style={{ ...big, fontSize: 30, color: 'var(--c-ink)' }}>{stats.played}</div>
                <div style={{ ...big, fontSize: 12, color: 'var(--c-mut)' }}>ігор пограно</div>
              </div>
            </div>
            <div style={{ ...card, padding: 14 }}>
              <div style={{ ...big, fontSize: 14, color: 'var(--c-mut)', marginBottom: 8 }}>Останні ігри</div>
              {stats.recent.length === 0 ? (
                <div style={{ ...big, fontSize: 14, color: 'var(--c-mut)' }}>Ще не грали</div>
              ) : stats.recent.map((g) => {
                const def = getGame(g.game_id);
                return (
                  <div key={g.game_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                    <span style={{ fontSize: 22 }}>{def?.icon ?? '🎲'}</span>
                    <span style={{ ...big, flex: 1, fontSize: 15, color: 'var(--c-ink)' }}>{def?.title ?? g.game_id}</span>
                    <span style={{ ...big, fontSize: 14, color: 'var(--c-mut)' }}>⭐ {g.stars}</span>
                  </div>
                );
              })}
            </div>

            {/* підключити пристрій дитини */}
            {code ? (
              <div style={{ ...card, padding: 16, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', boxShadow: '0 0 0 3px var(--c-primary)' }}>
                <div style={{ ...big, fontSize: 16, color: 'var(--c-ink)' }}>{child.nickname} · код для входу</div>
                <div style={{ ...big, fontSize: 40, letterSpacing: 8, color: left ? 'var(--c-primary)' : 'var(--c-mut)' }}>{code.value.slice(0, 3)} {code.value.slice(3)}</div>
                <div style={{ ...big, fontSize: 13, color: 'var(--c-mut)' }}>{left ? `діє ще ${mmss}` : 'код протермінований'}</div>
                {left ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: '100%' }}>
                    <button onClick={copy} style={soft}>{copied ? 'Скопійовано ✓' : 'Копіювати'}</button>
                    <button onClick={share} style={soft}>Поділитися</button>
                  </div>
                ) : (
                  <button onClick={() => setCode({ value: newCode(), until: Date.now() + CODE_TTL_MS })} style={primary}>Новий код</button>
                )}
                <div style={{ ...big, fontSize: 12, color: 'var(--c-mut)', textAlign: 'center' }}>На пристрої дитини: Школярик → «або код від батьків»</div>
              </div>
            ) : (
              <button onClick={() => setCode({ value: newCode(), until: Date.now() + CODE_TTL_MS })} style={primary}>Підключити пристрій дитини</button>
            )}

            <button onClick={() => navigate('/?add=1')} style={soft}>+ Додати ще дитину</button>
          </>
        )}
      </div>
    </div>
  );
}
