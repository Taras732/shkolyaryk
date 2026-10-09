import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useProfileStore } from '@/stores/useProfileStore';
import { CLASS_LEVELS, type ClassLevel } from '@/games/types';
import PuppetBunny from '@/pages/poc/PuppetBunny';
import { deviceChild, redeemCode, setDeviceChild } from '@/school/device-code';
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
  { id: 'rabbit', img: '/creatures/zodiac_rabbit_wood.png', bg: '#DFF7E6', label: 'Зайчик' },
  { id: 'tiger', img: '/creatures/zodiac_tiger_metal.png', bg: '#E3EEFF', label: 'Тигреня' },
  { id: 'dragon', img: '/creatures/zodiac_dragon_fire.png', bg: '#FFE9D6', label: 'Дракончик' },
  { id: 'horse', img: '/creatures/zodiac_horse_water.png', bg: '#EDE7FF', label: 'Конячка' },
];
/** Небо галявини (рішення 09.10: галявина замість фіолетової сцени). */
const SKY = 'linear-gradient(180deg, #BFE3FF 0%, #DDEFFF 50%, #F3EEFF 100%)';

/** Анімації сцени; prefers-reduced-motion вимикає все. */
const SCENE_CSS = `
@keyframes shk-drift { from { transform: translateX(-30px) } to { transform: translateX(30px) } }
@keyframes shk-spin { to { transform: rotate(360deg) } }
@keyframes shk-sway { 0%,100% { transform: rotate(-6deg) } 50% { transform: rotate(6deg) } }
@keyframes shk-fly { 0% { transform: translate(0,0) } 25% { transform: translate(40px,-20px) } 50% { transform: translate(80px,5px) } 75% { transform: translate(40px,25px) } 100% { transform: translate(0,0) } }
@keyframes shk-flap { 0%,100% { transform: scaleX(1) } 50% { transform: scaleX(.3) } }
@keyframes shk-rise { from { opacity: 0; transform: scale(.85) } to { opacity: 1; transform: scale(1) } }
.shk-cloud { animation: shk-drift 9s ease-in-out infinite alternate }
.shk-cloud.slow { animation-duration: 14s; animation-direction: alternate-reverse }
.shk-sun { transform-origin: 340px 90px; animation: shk-spin 40s linear infinite }
.shk-flower { transform-box: fill-box; transform-origin: bottom center; animation: shk-sway 3s ease-in-out infinite }
.shk-fly { animation: shk-fly 12s ease-in-out infinite }
.shk-wing { transform-box: fill-box; transform-origin: center; animation: shk-flap .35s ease-in-out infinite }
.shk-rainbow { transform-origin: 50% 100%; animation: shk-rise 1.2s cubic-bezier(.3,.7,.3,1) both }
@media (prefers-reduced-motion: reduce) { .shk-cloud,.shk-sun,.shk-flower,.shk-fly,.shk-wing,.shk-rainbow { animation: none } }
`;

/** Тло: сонце, хмари, пагорби з квітами, метелик. Веселка — окремо, за зайчиком. */
function Meadow() {
  const flower = (x: number, y: number, c: string, d: number) => (
    <g className="shk-flower" style={{ animationDelay: `${d}s` }}>
      <path d={`M${x} ${y} v14`} stroke="#6CC27E" strokeWidth="2" />
      <circle cx={x} cy={y} r="6" fill={c} /><circle cx={x} cy={y} r="2.4" fill="#FFE58A" />
    </g>
  );
  return (
    <svg viewBox="0 0 400 860" preserveAspectRatio="xMidYMax slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} aria-hidden>
      <g className="shk-sun">
        {Array.from({ length: 10 }, (_, i) => <rect key={i} x="337" y="44" width="6" height="16" rx="3" fill="#FFD95A" transform={`rotate(${i * 36} 340 90)`} />)}
      </g>
      <circle cx="340" cy="90" r="26" fill="#FFD95A" />
      <g className="shk-cloud" fill="#fff" opacity=".95"><ellipse cx="80" cy="150" rx="46" ry="18" /><ellipse cx="110" cy="138" rx="30" ry="20" /></g>
      <g className="shk-cloud slow" fill="#fff" opacity=".9"><ellipse cx="250" cy="220" rx="44" ry="15" /><ellipse cx="232" cy="208" rx="24" ry="16" /></g>
      <g className="shk-cloud" fill="#fff" opacity=".8" style={{ animationDelay: '-4s' }}><ellipse cx="170" cy="70" rx="30" ry="11" /></g>
      <path d="M0 610 Q120 560 220 590 T400 575 V860 H0Z" fill="#CDEFD2" />
      <path d="M0 650 Q140 610 260 640 T400 632 V860 H0Z" fill="#A9E2B4" />
      {flower(30, 600, '#FFB3C7', 0)}{flower(70, 588, '#C9B6FF', 0.6)}{flower(120, 596, '#FFD0A8', 1.4)}
      {flower(300, 592, '#FFB3C7', 1.1)}{flower(345, 584, '#FFD0A8', 0.3)}{flower(380, 596, '#C9B6FF', 1.6)}
      <g className="shk-fly">
        <g transform="translate(60 300)">
          <ellipse className="shk-wing" cx="-6" cy="0" rx="7" ry="9" fill="#FF9EC0" />
          <ellipse className="shk-wing" cx="6" cy="0" rx="7" ry="9" fill="#FFC1D8" />
          <rect x="-1.2" y="-7" width="2.4" height="14" rx="1.2" fill="#5B4B8A" />
        </g>
      </g>
    </svg>
  );
}

/** Веселка за зайчиком. */
function Rainbow() {
  const arcs = ['#FF8FA3', '#FFC36B', '#FFE58A', '#8EDB9E', '#8CC8FF', '#B79CFF'];
  return (
    <svg className="shk-rainbow" viewBox="0 0 300 162" style={{ position: 'absolute', left: '50%', bottom: 58, width: 300, marginLeft: -150 }} aria-hidden>
      {arcs.map((c, i) => <path key={c} d={`M${10 + i * 12} 150 A${140 - i * 12} ${140 - i * 12} 0 0 1 ${290 - i * 12} 150`} fill="none" stroke={c} strokeWidth="12" opacity=".85" />)}
      {/* хмарки на кінцях веселки */}
      <g fill="#fff"><ellipse cx="42" cy="146" rx="40" ry="16" /><ellipse cx="30" cy="134" rx="20" ry="14" /><ellipse cx="258" cy="146" rx="40" ry="16" /><ellipse cx="272" cy="134" rx="20" ry="14" /></g>
    </svg>
  );
}

const AGE_GROUP: Record<ClassLevel, '5-6' | '6-7' | '7-8'> = { preschool: '5-6', grade1: '6-7', grade2: '7-8', grade3: '7-8', grade4: '7-8' };
const TILE_BG = ['#FFE9D6', '#DFF7E6', '#EDE7FF', '#FFF3C8', '#FFE3EC', '#E3EEFF'];

const big = { fontFamily: 'var(--font-round)', fontWeight: 900 } as const;
const card = { background: '#fff', borderRadius: 24, boxShadow: 'var(--c-shadow)' } as const;
const primary = { ...big, border: 0, borderRadius: 20, padding: '15px 0', fontSize: 18, background: 'var(--c-primary)', color: '#fff', cursor: 'pointer' } as const;
const field = { ...big, fontSize: 16, border: 0, borderRadius: 16, background: 'var(--c-bg)', padding: '13px 16px', color: 'var(--c-ink)', outline: 'none' } as const;
const label = { ...big, fontSize: 13, color: 'var(--c-mut)', margin: '0 0 6px 4px' } as const;
const link = { ...big, border: 0, background: 'none', fontSize: 13, color: 'var(--c-mut)', cursor: 'pointer', padding: 4 } as const;

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
  const { user, signInGuest, signInWithGoogle, signIn, signUp, error: authError } = useAuthStore();
  const { profiles, loading, loadProfiles, createProfile, selectProfile } = useProfileStore();
  const [step, setStep] = useState<Step | null>(null);
  const [role, setRole] = useState<Role>(readRole() ?? 'parent');
  const [name, setName] = useState('');
  const [level, setLevel] = useState<ClassLevel>('preschool');
  const [friend, setFriend] = useState(FRIENDS[0].id);
  const [sheet, setSheet] = useState<'signin' | 'mail'>('signin');
  const [code, setCode] = useState('');
  const [codeMsg, setCodeMsg] = useState('');
  const [codeHelp, setCodeHelp] = useState(false);
  const [mailNew, setMailNew] = useState(false);
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [face, setFace] = useState<Face>('smile');
  const [bounce, setBounce] = useState(0);

  useEffect(() => {
    loadProfiles(user?.id);
  }, [user, loadProfiles]);

  // куди вести: вирішуємо, коли профілі підвантажились
  // ?pick — свідомо прийшли змінити профіль: не перекидати назад на головну
  const wantPick = new URLSearchParams(window.location.search).has('pick');
  // ?add=1 — батьки додають дитину з «Батькам»; після «Готово» повертаємось туди з кодом
  const wantAdd = new URLSearchParams(window.location.search).has('add');
  // ?login=1 — показати вхід, як на новому пристрої (для перевірки коду на одному браузері)
  const wantLogin = new URLSearchParams(window.location.search).has('login');
  useEffect(() => {
    if (loading || step !== null) return;
    const mine = deviceChild();
    const own = mine ? profiles.find((p) => p.id === mine) : undefined;
    if (wantLogin) setStep('hello');
    else if (wantAdd) setStep('child');
    else if (own && !wantPick) {
      // пристрій дитини (увійшла за кодом) — одразу її головна
      selectProfile(own.id);
      navigate('/hub', { replace: true });
    }
    else if (wantPick && profiles.length > 0) setStep('pick');
    else if (profiles.length === 1) {
      selectProfile(profiles[0].id);
      navigate('/hub', { replace: true });
    } else if (profiles.length > 1) setStep('pick');
    else if (user && readRole() !== 'student') navigate('/parents', { replace: true }); // батьки без дітей — дашборд з підсвіченим «Додай дитину»
    else setStep(user ? 'child' : 'hello');
  }, [loading, profiles, step, wantPick, wantAdd, wantLogin, user, selectProfile, navigate]);

  // повернення з Google веде на /onboarding = цей самий екран; далі вирішує ефект маршруту
  const google = async () => {
    await signInWithGoogle();
  };

  // гість: локальний режим без акаунта, профіль дитини створює дорослий
  const guest = async () => {
    pickRole('parent');
    await signInGuest();
    setStep('child');
  };

  // TODO(supabase): код родини звіряється на сервері (таблиця family_codes); без бази — чесна відмова
  const joinFamily = async (value: string) => {
    const id = redeemCode(value);
    const kid = id ? useProfileStore.getState().profiles.find((p) => p.id === id) : undefined;
    if (!kid) {
      setCodeMsg('Код не підходить або вже протермінований. Попроси новий.');
      setCode('');
      return;
    }
    pickRole('student');
    setDeviceChild(kid.id); // пристрій тепер її: далі одразу головна
    selectProfile(kid.id);
    navigate('/hub', { replace: true });
  };

  const pickRole = (r: Role) => {
    setRole(r);
    try {
      localStorage.setItem(ROLE_KEY, r);
    } catch {
      // без пам'яті — не біда
    }
    if (r === 'student' && level === 'preschool') setLevel('grade1');
  };

  const byMail = async () => {
    try {
      localStorage.setItem(ROLE_KEY, role);
    } catch {
      // без пам'яті — не біда
    }
    await (mailNew ? signUp(email.trim(), pw) : signIn(email.trim(), pw));
    // увійшли — профілі підвантажаться під акаунт, далі вирішить той самий ефект маршруту
    if (!useAuthStore.getState().error) setStep(null);
  };

  const create = async () => {
    if (!name.trim()) return;
    await createProfile(name.trim(), AGE_GROUP[level], friend, user?.id, level);
    const made = useProfileStore.getState().profiles.find((p) => p.nickname === name.trim());
    if (made) selectProfile(made.id);
    // батьківський акаунт — у «Батькам» з кодом для нової дитини; гість — одразу грати
    if (wantAdd || user) navigate(made ? `/parents?code=${made.id}` : '/parents', { replace: true });
    else navigate('/hub', { replace: true });
  };

  const pick = (id: string) => {
    selectProfile(id);
    navigate('/hub');
  };

  if (step === null) return null;
  const levels = role === 'student' ? CLASS_LEVELS.filter((l) => l !== 'preschool') : CLASS_LEVELS;

  return (
    <div style={{ width: '100%', height: '100dvh', background: SKY, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <style>{SCENE_CSS}</style>
      <Meadow />
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', zIndex: 1, padding: '14px 16px calc(56px + env(safe-area-inset-bottom))', maxWidth: 520, width: '100%', margin: '0 auto' }}>
        {step === 'hello' && (
          <>
            {/* сцена по центру вільного місця: веселка, зайчик, назва */}
            <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
              <div style={{ position: 'relative', width: 300, paddingTop: 70, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Rainbow />
                <div style={{ width: 150, position: 'relative' }}>
                  <PuppetBunny face={face} bounce={bounce} onZone={() => { setFace('happy'); setBounce((b) => b + 1); setTimeout(() => setFace('smile'), 1200); }} />
                </div>
                <div style={{ ...big, fontSize: 34, color: 'var(--c-ink)', position: 'relative', textShadow: '0 2px 0 #fff' }}>Школярик</div>
              </div>
            </div>

            {/* аркуш: вхід — основний; реєстрація і гість — дрібно знизу */}
            <div style={{ ...card, padding: 14, display: 'flex', flexDirection: 'column', gap: 10, position: 'relative', zIndex: 1 }}>
              {sheet === 'signin' && (
                <>
                  {/* дорослий — Google; дитина — код від батьків; обидва на одному аркуші (рішення 09.10) */}
                  <motion.button whileTap={{ scale: 0.97 }} onClick={google} style={primary}>Продовжити з Google</motion.button>
                  <button onClick={() => { setMailNew(false); setSheet('mail'); }} style={{ ...link, marginTop: -4 }}>або поштою</button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 1, background: 'var(--c-line)' }} />
                    <span style={{ ...big, fontSize: 13, color: 'var(--c-mut)' }}>або код від батьків</span>
                    <div style={{ flex: 1, height: 1, background: 'var(--c-line)' }} />
                  </div>
                  <input value={code} inputMode="numeric" autoComplete="one-time-code" placeholder="••• •••" aria-label="Код від батьків"
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setCode(v);
                      setCodeMsg('');
                      if (v.length === 6) joinFamily(v); // шоста цифра — входимо одразу, без кнопки
                    }}
                    style={{ ...field, textAlign: 'center', fontSize: 26, letterSpacing: 8, padding: '10px 12px' }} />
                  {codeMsg && <div style={{ ...big, fontSize: 13, color: '#B04A6A', textAlign: 'center' }}>{codeMsg}</div>}
                  {codeHelp ? (
                    <div style={{ ...big, fontSize: 13, color: 'var(--c-ink)', background: '#FFF3C8', borderRadius: 14, padding: '10px 12px', textAlign: 'center', lineHeight: 1.35 }}>
                      Попроси маму чи тата: <b>Батькам → Підключити пристрій</b>. Або хай вони увійдуть тут через Google.
                    </div>
                  ) : (
                    <button onClick={() => setCodeHelp(true)} style={{ ...link, marginTop: -4 }}>Немає коду?</button>
                  )}

                  <div style={{ height: 1, background: 'var(--c-line)', margin: '2px 8px' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button onClick={() => { pickRole('parent'); setMailNew(true); setSheet('mail'); }} style={{ ...link, fontSize: 14 }}>
                      <span style={{ color: 'var(--c-primary)' }}>Зареєструватися</span>
                    </button>
                    <button onClick={guest} style={{ ...link, fontSize: 12, opacity: 0.8 }}>Без акаунта</button>
                  </div>
                </>
              )}
              {sheet === 'mail' && (
                <>
                  <div style={{ ...big, fontSize: 20, color: 'var(--c-ink)', textAlign: 'center' }}>{mailNew ? 'Реєстрація' : 'Вхід поштою'}</div>
                  {/* реєстрація дзеркальна до входу: та сама кнопка Google зверху, пошта — другорядно */}
                  {mailNew && (
                    <>
                      <motion.button whileTap={{ scale: 0.97 }} onClick={google} style={primary}>Продовжити з Google</motion.button>
                      <div style={{ ...big, fontSize: 13, color: 'var(--c-mut)', textAlign: 'center' }}>або поштою</div>
                    </>
                  )}
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Пошта" autoComplete="email" style={field} />
                  <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Пароль" autoComplete={mailNew ? 'new-password' : 'current-password'} style={field} />
                  <motion.button whileTap={{ scale: 0.97 }} onClick={byMail} disabled={!email || pw.length < 6}
                    style={mailNew
                      ? { ...big, border: '2px solid var(--c-line)', borderRadius: 20, padding: '13px 0', fontSize: 16, background: '#fff', color: 'var(--c-ink)', cursor: 'pointer', opacity: email && pw.length >= 6 ? 1 : 0.5 }
                      : { ...primary, opacity: email && pw.length >= 6 ? 1 : 0.5 }}>
                    {mailNew ? 'Створити акаунт' : 'Увійти'}
                  </motion.button>
                  <button onClick={() => setSheet('signin')} style={link}>← Назад</button>
                </>
              )}
              {authError && <div style={{ ...big, fontSize: 13, color: '#B04A6A', textAlign: 'center' }}>{authError}</div>}
            </div>
          </>
        )}

        {step === 'child' && (() => {
          const fr = FRIENDS.find((x) => x.id === friend) ?? FRIENDS[0];
          return (
            <>
              {/* варіант B (рішення 09.10): сходинки віку, обраний друг великий, решта кружечками */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <button onClick={() => (wantAdd ? navigate('/parents') : setStep('hello'))} style={{ ...link, fontSize: 22 }} aria-label="Назад">←</button>
                <div style={{ ...big, fontSize: 22, color: 'var(--c-ink)' }}>{role === 'student' ? 'Розкажи про себе!' : 'Додаймо дитину!'}</div>
              </div>

              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={20} placeholder={role === 'student' ? 'Твоє імʼя' : 'Імʼя дитини'}
                style={{ ...big, ...card, border: 0, fontSize: 26, textAlign: 'center', padding: '14px 12px', color: 'var(--c-ink)', outline: 'none' }} />

              <div>
                <div style={label}>{role === 'student' ? 'Клас' : 'Садок чи клас'}</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 118 }}>
                  {levels.map((l) => {
                    const on = level === l;
                    const step5 = CLASS_LEVELS.indexOf(l); // 0 садок … 4 клас — висота сходинки
                    return (
                      <motion.button key={l} onClick={() => setLevel(l)} whileTap={{ scale: 0.94 }}
                        style={{ ...big, flex: 1, height: `${44 + step5 * 14}%`, border: 0, borderRadius: '14px 14px 8px 8px', cursor: 'pointer', background: on ? 'var(--c-primary)' : TILE_BG[step5 % TILE_BG.length], color: on ? '#fff' : 'var(--c-ink)', boxShadow: on ? '0 6px 14px rgba(124,58,237,.3)' : 'var(--c-shadow)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 8, lineHeight: 1, transition: 'background .2s' }}>
                        {l === 'preschool' ? <span style={{ fontSize: 13 }}>садок</span> : (
                          <>
                            <span style={{ fontSize: 22 }}>{l.slice(-1)}</span>
                            <span style={{ fontSize: 10, opacity: 0.75 }}>клас</span>
                          </>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <motion.img key={fr.id} src={fr.img} alt="" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }}
                  style={{ width: 200, maxHeight: '100%', minHeight: 0, objectFit: 'contain' }} />
                <div style={{ ...big, fontSize: 15, color: 'var(--c-mut)' }}>{fr.label}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {FRIENDS.map((x) => (
                  <motion.button key={x.id} whileTap={{ scale: 0.9 }} onClick={() => setFriend(x.id)} aria-label={x.label}
                    style={{ border: 0, borderRadius: '50%', background: x.bg, padding: 6, cursor: 'pointer', aspectRatio: '1', minWidth: 0, boxShadow: friend === x.id ? '0 0 0 3px var(--c-primary)' : 'var(--c-shadow)' }}>
                    <img src={x.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </motion.button>
                ))}
              </div>

              <motion.button whileTap={{ scale: 0.97 }} onClick={create} disabled={!name.trim()} style={{ ...primary, opacity: name.trim() ? 1 : 0.45 }}>Готово</motion.button>
            </>
          );
        })()}

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
