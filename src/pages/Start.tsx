import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useProfileStore } from '@/stores/useProfileStore';
import { CLASS_META, CLASS_LEVELS, type ClassLevel } from '@/games/types';
import PuppetBunny from '@/pages/poc/PuppetBunny';
import type { Face } from '@/pages/poc/Bunny';

/**
 * Вхід одним екраном у стилі головної дошкілля (рішення 09.10.2026).
 * Роль і вік питаємо один раз; далі дитина щоразу потрапляє одразу на свою головну.
 *   перший раз:  знайомство (хто ви + вхід) → додай дитину → головна
 *   повернення:  одна дитина → одразу головна; кілька → «хто грає?» → головна
 * Старі екрани (Welcome, Auth, RoleSelect, Onboarding, Placement) лишились у коді, але не на шляху.
 */
type Role = 'parent' | 'student';
type Step = 'hello' | 'child' | 'pick';

const ROLE_KEY = 'shk.role';
const FRIENDS = [
  { id: 'rabbit', img: '/creatures/zodiac_rabbit_wood.png', bg: '#DFF7E6' },
  { id: 'tiger', img: '/creatures/zodiac_tiger_metal.png', bg: '#E3EEFF' },
  { id: 'dragon', img: '/creatures/zodiac_dragon_fire.png', bg: '#FFE9D6' },
  { id: 'horse', img: '/creatures/zodiac_horse_water.png', bg: '#EDE7FF' },
];
// ролі звірятами, не емодзі: дорослий — великий бичок із зайченям, учень — тигреня
const ROLES: { id: Role; title: string; hint: string; bg: string; imgs: string[] }[] = [
  { id: 'parent', title: 'Я дорослий', hint: 'додам дитину', bg: '#FFE9D6', imgs: ['/creatures/zodiac_ox_earth.png', '/creatures/zodiac_rabbit_wood.png'] },
  { id: 'student', title: 'Я учень', hint: 'граю сам', bg: '#DFF7E6', imgs: ['/creatures/zodiac_tiger_metal.png'] },
];
const AGE_GROUP: Record<ClassLevel, '5-6' | '6-7' | '7-8'> = { preschool: '5-6', grade1: '6-7', grade2: '7-8', grade3: '7-8', grade4: '7-8' };
const TILE_BG = ['#FFE9D6', '#DFF7E6', '#EDE7FF', '#FFF3C8', '#FFE3EC', '#E3EEFF'];

/** Тло екранів входу: мʼякий пастельний градієнт замість сірого (як небо над головною). */
const BG = 'radial-gradient(120% 60% at 50% 0%, #EFE9FF 0%, transparent 70%), radial-gradient(90% 50% at 0% 100%, #FFE9D6 0%, transparent 70%), radial-gradient(90% 50% at 100% 100%, #DFF7E6 0%, transparent 70%), #FBFAFF';

const big = { fontFamily: 'var(--font-round)', fontWeight: 900 } as const;
const card = { background: '#fff', borderRadius: 24, boxShadow: 'var(--c-shadow)' } as const;

function readRole(): Role | null {
  try {
    const r = localStorage.getItem(ROLE_KEY);
    return r === 'parent' || r === 'student' ? r : null;
  } catch {
    return null;
  }
}

export default function Start() {
  const navigate = useNavigate();
  const { user, signInGuest, signInWithGoogle, error: authError } = useAuthStore();
  const { profiles, loading, loadProfiles, createProfile, selectProfile } = useProfileStore();
  const [step, setStep] = useState<Step | null>(null);
  const [role, setRole] = useState<Role>(readRole() ?? 'parent');
  const [name, setName] = useState('');
  const [level, setLevel] = useState<ClassLevel>('preschool');
  const [friend, setFriend] = useState(FRIENDS[0].id);
  const [face, setFace] = useState<Face>('smile');
  const [bounce, setBounce] = useState(0);

  useEffect(() => {
    loadProfiles(user?.id);
  }, [user, loadProfiles]);

  // куди вести: вирішуємо, коли профілі підвантажились
  // ?pick — свідомо прийшли змінити профіль: не перекидати назад на головну
  const wantPick = new URLSearchParams(window.location.search).has('pick');
  useEffect(() => {
    if (loading || step !== null) return;
    if (wantPick && profiles.length > 0) setStep('pick');
    else if (profiles.length === 1) {
      selectProfile(profiles[0].id);
      navigate('/hub', { replace: true });
    } else if (profiles.length > 1) setStep('pick');
    else setStep(readRole() ? 'child' : 'hello');
  }, [loading, profiles, step, wantPick, selectProfile, navigate]);

  const begin = async (how: 'guest' | 'google') => {
    try {
      localStorage.setItem(ROLE_KEY, role);
    } catch {
      // без пам'яті — спитаємо ще раз, не біда
    }
    if (role === 'student' && level === 'preschool') setLevel('grade1');
    if (how === 'google') {
      await signInWithGoogle(); // повернення з Google веде на /onboarding = цей самий екран
      return;
    }
    await signInGuest();
    setStep('child');
  };

  const create = async () => {
    if (!name.trim()) return;
    await createProfile(name.trim(), AGE_GROUP[level], friend, user?.id, level);
    const made = useProfileStore.getState().profiles.find((p) => p.nickname === name.trim());
    if (made) selectProfile(made.id);
    navigate('/hub', { replace: true });
  };

  const pick = (id: string) => {
    selectProfile(id);
    navigate('/hub');
  };

  if (step === null) return null;
  const levels = role === 'student' ? CLASS_LEVELS.filter((l) => l !== 'preschool') : CLASS_LEVELS;

  return (
    <div style={{ width: '100%', height: '100dvh', background: BG, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 12, padding: '14px 16px calc(16px + env(safe-area-inset-bottom))', maxWidth: 520, width: '100%', margin: '0 auto' }}>
        {step === 'hello' && (
          <>
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <div style={{ width: 150 }}>
                <PuppetBunny face={face} bounce={bounce} onZone={() => { setFace('happy'); setBounce((b) => b + 1); setTimeout(() => setFace('smile'), 1200); }} />
              </div>
              <div style={{ ...big, fontSize: 32, color: 'var(--c-ink)' }}>Школярик</div>
              <div style={{ ...big, fontSize: 15, color: 'var(--c-mut)' }}>Граємося та вчимося</div>
            </div>

            <div style={{ ...big, fontSize: 15, color: 'var(--c-mut)', textAlign: 'center' }}>Хто тут?</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {ROLES.map((r) => (
                <motion.button key={r.id} whileTap={{ scale: 0.95 }} onClick={() => setRole(r.id)}
                  style={{ ...big, border: 0, borderRadius: 22, background: r.bg, padding: '10px 8px 12px', fontSize: 16, color: 'var(--c-ink)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, boxShadow: role === r.id ? '0 0 0 3px var(--c-primary)' : 'var(--c-shadow)' }}>
                  <span style={{ height: 70, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                    {r.imgs.map((src, i) => (
                      <img key={src} src={src} alt="" style={{ height: i === 0 ? 70 : 46, marginLeft: i ? -14 : 0, objectFit: 'contain' }} />
                    ))}
                  </span>
                  {r.title}
                  <span style={{ fontSize: 12, color: 'var(--c-mut)' }}>{r.hint}</span>
                </motion.button>
              ))}
            </div>

            <motion.button whileTap={{ scale: 0.97 }} onClick={() => begin('google')}
              style={{ ...big, ...card, border: 0, padding: '14px 0', fontSize: 17, color: 'var(--c-ink)', cursor: 'pointer' }}>
              Увійти через Google
            </motion.button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => begin('guest')}
              style={{ ...big, border: 0, borderRadius: 24, padding: '14px 0', fontSize: 17, background: 'var(--c-primary)', color: '#fff', cursor: 'pointer' }}>
              Почати без акаунта
            </motion.button>
            {authError && <div style={{ ...big, fontSize: 13, color: '#B04A6A', textAlign: 'center' }}>{authError}</div>}
            <button onClick={() => navigate('/auth')} style={{ ...big, border: 0, background: 'none', fontSize: 13, color: 'var(--c-mut)', cursor: 'pointer' }}>
              Увійти поштою
            </button>
          </>
        )}

        {step === 'child' && (
          <>
            <div style={{ ...big, fontSize: 26, color: 'var(--c-ink)', textAlign: 'center', marginTop: 8 }}>{role === 'student' ? 'Про тебе' : 'Додай дитину'}</div>
            <div style={{ ...card, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder={role === 'student' ? 'Як тебе звати?' : "Ім'я дитини"} maxLength={20}
                style={{ ...big, fontSize: 18, border: 0, borderRadius: 16, background: 'var(--c-bg)', padding: '14px 16px', color: 'var(--c-ink)', outline: 'none' }} />

              <div style={{ ...big, fontSize: 14, color: 'var(--c-mut)' }}>{role === 'student' ? 'У якому ти класі?' : 'Вік'}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {levels.map((l) => (
                  <button key={l} onClick={() => setLevel(l)}
                    style={{ ...big, border: 0, borderRadius: 99, padding: '9px 14px', fontSize: 15, cursor: 'pointer', background: level === l ? 'var(--c-primary)' : 'var(--c-bg)', color: level === l ? '#fff' : 'var(--c-ink)' }}>
                    {CLASS_META[l].short}
                  </button>
                ))}
              </div>

              <div style={{ ...big, fontSize: 14, color: 'var(--c-mut)' }}>Друг</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {FRIENDS.map((f) => (
                  <motion.button key={f.id} whileTap={{ scale: 0.92 }} onClick={() => setFriend(f.id)} aria-label={f.id}
                    style={{ border: 0, borderRadius: 18, background: f.bg, padding: 4, cursor: 'pointer', aspectRatio: '1', minWidth: 0, overflow: 'hidden', boxShadow: friend === f.id ? '0 0 0 3px var(--c-primary)' : 'none' }}>
                    <img src={f.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </motion.button>
                ))}
              </div>
            </div>
            <div style={{ flex: 1 }} />
            <motion.button whileTap={{ scale: 0.97 }} onClick={create} disabled={!name.trim()}
              style={{ ...big, border: 0, borderRadius: 24, padding: '16px 0', fontSize: 18, background: 'var(--c-primary)', color: '#fff', cursor: 'pointer', opacity: name.trim() ? 1 : 0.4 }}>
              Готово
            </motion.button>
          </>
        )}

        {step === 'pick' && (
          <>
            <div style={{ ...big, fontSize: 26, color: 'var(--c-ink)', textAlign: 'center', marginTop: 8 }}>Хто грає?</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {profiles.map((p, i) => {
                const f = FRIENDS.find((x) => x.id === p.avatar_id);
                return (
                  <motion.button key={p.id} whileTap={{ scale: 0.95 }} onClick={() => pick(p.id)}
                    style={{ ...big, border: 0, borderRadius: 24, background: TILE_BG[i % TILE_BG.length], padding: '14px 8px', cursor: 'pointer', boxShadow: 'var(--c-shadow)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, fontSize: 18, color: 'var(--c-ink)' }}>
                    <img src={f?.img ?? `/creatures/zodiac_${p.avatar_id}_fire.png`} alt="" style={{ width: 84, height: 84, objectFit: 'contain' }}
                      onError={(e) => { (e.target as HTMLImageElement).src = FRIENDS[0].img; }} />
                    {p.nickname}
                  </motion.button>
                );
              })}
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setStep('child')}
                style={{ ...big, border: '2px dashed var(--c-line)', borderRadius: 24, background: 'transparent', padding: '14px 8px', cursor: 'pointer', fontSize: 16, color: 'var(--c-mut)' }}>
                + Ще дитина
              </motion.button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
