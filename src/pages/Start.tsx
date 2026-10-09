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
const ROLES: { id: Role; title: string }[] = [
  { id: 'parent', title: 'Я дорослий' },
  { id: 'student', title: 'Я учень' },
];

/**
 * Два варіанти сцени знайомства на вибір (?v=a | ?v=b), зміст однаковий:
 *  a — галявина: небо, хмаринки, пагорб, зайчик стоїть на траві;
 *  b — фіолетова сцена, як блок «на сьогодні» на головній.
 */
const SKY = 'linear-gradient(180deg, #BFE3FF 0%, #DDEFFF 45%, #F3EEFF 100%)';
const VIOLET = 'radial-gradient(80% 50% at 20% 10%, #9B6BFF 0%, transparent 60%), radial-gradient(70% 45% at 90% 40%, #6D28D9 0%, transparent 60%), #7C3AED';

function Meadow() {
  return (
    <svg viewBox="0 0 400 860" preserveAspectRatio="xMidYMax slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} aria-hidden>
      <g fill="#fff" opacity=".9">
        <ellipse cx="80" cy="120" rx="46" ry="18" /><ellipse cx="110" cy="108" rx="30" ry="20" />
        <ellipse cx="310" cy="190" rx="52" ry="18" /><ellipse cx="290" cy="178" rx="28" ry="18" />
        <ellipse cx="200" cy="70" rx="30" ry="11" />
      </g>
      <path d="M0 560 Q120 500 220 540 T400 520 V860 H0Z" fill="#CDEFD2" />
      <path d="M0 610 Q140 560 260 600 T400 590 V860 H0Z" fill="#A9E2B4" />
      <g fill="#FFD1DC"><circle cx="60" cy="640" r="5" /><circle cx="340" cy="625" r="5" /><circle cx="300" cy="660" r="4" /></g>
      <g fill="#FFE58A"><circle cx="90" cy="660" r="4" /><circle cx="250" cy="640" r="4" /></g>
    </svg>
  );
}
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
  const variant = new URLSearchParams(window.location.search).get('v') === 'b' ? 'b' : 'a';
  const levels = role === 'student' ? CLASS_LEVELS.filter((l) => l !== 'preschool') : CLASS_LEVELS;

  return (
    <div style={{ width: '100%', height: '100dvh', background: step === 'hello' ? (variant === 'b' ? VIOLET : SKY) : BG, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {step === 'hello' && variant === 'a' && <Meadow />}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 12, padding: '14px 16px calc(16px + env(safe-area-inset-bottom))', maxWidth: 520, width: '100%', margin: '0 auto' }}>
        {step === 'hello' && (
          <>
            {/* сцена: зайчик + назва, без підзаголовків */}
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: variant === 'b' ? 'center' : 'flex-end', gap: 4, paddingBottom: variant === 'b' ? 0 : '8dvh', position: 'relative', zIndex: 1 }}>
              <div style={{ width: 160 }}>
                <PuppetBunny face={face} bounce={bounce} onZone={() => { setFace('happy'); setBounce((b) => b + 1); setTimeout(() => setFace('smile'), 1200); }} />
              </div>
              <div style={{ ...big, fontSize: 34, color: variant === 'b' ? '#fff' : 'var(--c-ink)' }}>Школярик</div>
            </div>

            {/* аркуш з вибором: роль перемикачем, два входи */}
            <div style={{ ...card, padding: 14, display: 'flex', flexDirection: 'column', gap: 10, position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'var(--c-bg)', borderRadius: 18, padding: 4 }}>
                {ROLES.map((r) => (
                  <button key={r.id} onClick={() => setRole(r.id)}
                    style={{ ...big, border: 0, borderRadius: 14, padding: '11px 0', fontSize: 16, cursor: 'pointer', background: role === r.id ? '#fff' : 'transparent', color: role === r.id ? 'var(--c-primary)' : 'var(--c-mut)', boxShadow: role === r.id ? 'var(--c-shadow)' : 'none', transition: 'all .2s' }}>
                    {r.title}
                  </button>
                ))}
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => begin('guest')}
                style={{ ...big, border: 0, borderRadius: 20, padding: '15px 0', fontSize: 18, background: 'var(--c-primary)', color: '#fff', cursor: 'pointer' }}>
                Почати
              </motion.button>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => begin('google')}
                style={{ ...big, border: '2px solid var(--c-line)', borderRadius: 20, padding: '13px 0', fontSize: 16, background: '#fff', color: 'var(--c-ink)', cursor: 'pointer' }}>
                Увійти через Google
              </motion.button>
              {authError && <div style={{ ...big, fontSize: 13, color: '#B04A6A', textAlign: 'center' }}>{authError}</div>}
            </div>
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
