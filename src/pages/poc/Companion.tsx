import { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { sayUk } from '@/games/shared/uk-audio';
import { type Face, type Zone } from './Bunny';
import PetPuppet from '@/pets/PetPuppet';
import { usePet } from '@/pets/pets';
import { earnedToday, eatenToday, markEaten } from '@/pets/food';
import { useProfileStore } from '@/stores/useProfileStore';
import { readLog } from '@/school/game-log';
import { resolvePlan } from '@/school/plan-resolve';

/**
 * PoC звірятка v2 — «Друг-учень» (концепція B) + дотики з A.
 * «Дружимо»: дотики по зонах, морквина, сон. «Навчи зайчика»: дитина вчить звірятко
 * букв — шукає букву для нього або виправляє його помилку; звірятко запам'ятовує.
 */
type Mode = 'friend' | 'teach';
const LETTERS = ['А', 'О', 'У', 'М', 'Т', 'Н', 'Л', 'С'];
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);

type Round =
  | { kind: 'find'; target: string; options: string[] }
  | { kind: 'check'; target: string; shown: string };

function newRound(known: string[]): Round {
  const fresh = LETTERS.filter((l) => !known.includes(l));
  const target = pick(fresh.length ? fresh : LETTERS);
  if (Math.random() < 0.4) {
    const shown = Math.random() < 0.5 ? target : pick(LETTERS.filter((l) => l !== target));
    return { kind: 'check', target, shown };
  }
  return { kind: 'find', target, options: shuffle([target, ...shuffle(LETTERS.filter((l) => l !== target)).slice(0, 2)]) };
}

// Те, що дитина має впізнати, лише ЗВУЧИТЬ — у тексті бульбашки букви немає,
// інакше завдання зводиться до пошуку такої самої фігури.
const ask = (r: Round, first: boolean) =>
  r.kind === 'find' ? (first ? `Покажи мені букву ${r.target}!` : `А тепер — де буква ${r.target}?`) : `Я думаю, це буква ${r.target}. Правильно?`;
const askText = (r: Round, first: boolean) =>
  r.kind === 'find' ? (first ? 'Покажи мені букву, яку я скажу 🔊' : 'А тепер — послухай, яку букву шукаємо 🔊') : 'Я думаю, ця буква звучить так 🔊 Правильно?';

export default function Companion() {
  const pet = usePet(); // друг дитини, обраний на вході
  const profile = useProfileStore((s) => s.activeProfile);
  // їжа: зароблена сьогодні (кроки плану + вільні ігри) мінус уже з'їдена
  const earned = useMemo(() => (profile ? earnedToday(readLog(profile.id), resolvePlan(profile).slice(0, 3).map((s) => s.gameId)) : 0), [profile]);
  const [eaten, setEaten] = useState(() => (profile ? eatenToday(profile.id) : 0));
  const left = Math.max(0, earned - eaten);
  const [mode, setMode] = useState<Mode>('friend');
  const [face, setFace] = useState<Face>('smile');
  const [bounce, setBounce] = useState(0);
  const [ear, setEar] = useState<'L' | 'R' | null>(null);
  const [bubble, setBubble] = useState<string | null>(pet.say.hi);
  const [known, setKnown] = useState<string[]>([]);
  const [round, setRound] = useState<Round | null>(null);
  const zone = useRef<HTMLDivElement>(null);
  const bunnyBox = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const later = (ms: number, f: () => void) => { timers.current.push(setTimeout(f, ms)); };
  const react = (f: Face, text: string | null, ms = 1500, after: Face = 'smile', voice?: string, key = 'poc.bunny') => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setFace(f);
    setBubble(text);
    const v = voice ?? text;
    if (v) sayUk(key, v.replace(/[^\p{L}\p{N}\s!?,.'-]/gu, ''));
    later(ms, () => setFace(after));
  };

  const onZone = (z: Zone) => {
    if (face === 'sleep') { react('o', 'Ой, я спав… Доброго ранку!', 1800); return; }
    if (z === 'earL' || z === 'earR') { react('o', 'Ой, моє вушко!', 1000); setEar(z === 'earL' ? 'L' : 'R'); later(900, () => setEar(null)); }
    // кожен друг реагує по-своєму (pets.ts → say), голос — файлом pet_<id>_<зона>
    if (z === 'nose') react('o', pet.say.nose, 900, 'smile', undefined, `pet_${pet.id}_nose`);
    if (z === 'belly') { react('laugh', pet.say.belly, 1600, 'smile', undefined, `pet_${pet.id}_belly`); setBounce((b) => b + 1); }
    if (z === 'head') react('happy', pet.say.head, 1600, 'smile', undefined, `pet_${pet.id}_head`);
  };

  const feed = (x: number, y: number) => {
    const r = bunnyBox.current?.getBoundingClientRect();
    if (!r || x < r.left || x > r.right || y < r.top || y > r.bottom) return;
    if (profile) setEaten(markEaten(profile.id));
    react('chew', 'Ням-ням! Смачно!', 1300, 'happy', undefined, 'pet.yum');
    later(1300, () => { setBounce((b) => b + 1); setBubble('Смачно! Дякую!'); });
    later(3000, () => setFace('smile'));
  };

  const startTeach = () => {
    setMode('teach');
    const r = newRound(known);
    setRound(r);
    react('o', askText(r, true), 1200, 'smile', ask(r, true));
  };

  const next = (k: string[]) => {
    later(2000, () => {
      const r = newRound(k);
      setRound(r);
      setFace('o');
      setBubble(askText(r, false));
      sayUk('poc.bunny', ask(r, false));
      later(1200, () => setFace('smile'));
    });
  };

  const learned = (l: string) => {
    const k = known.includes(l) ? known : [...known, l];
    setKnown(k);
    setBounce((b) => b + 1);
    return k;
  };

  const answerFind = (l: string) => {
    if (!round || round.kind !== 'find') return;
    if (l === round.target) { react('happy', `Ура! Тепер я знаю букву ${l}!`, 1800); next(learned(l)); }
    else react('sad', 'Хм… здається, це інша буква. Спробуймо ще!', 1400);
  };

  const answerCheck = (yes: boolean) => {
    if (!round || round.kind !== 'check') return;
    const right = round.shown === round.target;
    if (yes === right) {
      react('happy', right ? `Так! Це ${round.target}! Запам'ятаю!` : `Дякую, що виправив! Це була буква ${round.shown}.`, 2000);
      next(learned(right ? round.target : round.shown));
    } else react('sad', 'Ой, а мені здається інакше… Подивись уважніше!', 1500);
  };

  const sleep = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setFace('sleep');
    setBubble('Добраніч… Завтра пограємо 💤');
    sayUk('poc.sleep', 'Добраніч. Завтра пограємо');
  };

  const big = { fontFamily: 'var(--font-round)', fontWeight: 900 } as const;
  const checkShown = mode === 'teach' && round?.kind === 'check';

  return (
    <div ref={zone} style={{ position: 'relative', width: '100%', aspectRatio: '9 / 14', maxHeight: '78vh', borderRadius: 28, overflow: 'hidden', background: face === 'sleep' ? 'linear-gradient(#2a2f5a, #4b4f86)' : 'linear-gradient(#fff4dc, #ffe6cf)', transition: 'background .8s', userSelect: 'none', touchAction: 'none' }}>
      {/* режими */}
      <div style={{ position: 'absolute', top: 12, left: 12, right: 12, display: 'flex', gap: 6, zIndex: 4 }}>
        <button onClick={() => { setMode('friend'); setRound(null); react('smile', 'Пограймося!', 800); }}
          style={{ ...big, flex: 1, border: 0, borderRadius: 14, padding: '9px 0', fontSize: 14, background: mode === 'friend' ? '#1F2138' : 'rgba(255,255,255,.85)', color: mode === 'friend' ? '#fff' : '#1F2138', cursor: 'pointer' }}>
          🤗 Дружимо
        </button>
        <button onClick={startTeach}
          style={{ ...big, flex: 1, border: 0, borderRadius: 14, padding: '9px 0', fontSize: 14, background: mode === 'teach' ? '#1F2138' : 'rgba(255,255,255,.85)', color: mode === 'teach' ? '#fff' : '#1F2138', cursor: 'pointer' }}>
          🎓 Навчи {pet.acc}
        </button>
      </div>

      {/* бульбашка мови */}
      <AnimatePresence mode="wait">
        {bubble && (
          <motion.div key={bubble} initial={{ scale: 0.6, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            style={{ ...big, position: 'absolute', top: '11%', left: '8%', right: '8%', background: '#fff', borderRadius: 20, padding: '10px 14px', fontSize: 17, textAlign: 'center', color: '#1F2138', boxShadow: '0 6px 16px -8px rgba(0,0,0,.3)', zIndex: 3 }}>
            {bubble}
            {mode === 'teach' && round && bubble === askText(round, true) || (mode === 'teach' && round && bubble === askText(round, false)) ? (
              <button onClick={() => sayUk('poc.bunny', ask(round!, false))} style={{ display: 'block', margin: '6px auto 0', border: 0, borderRadius: 99, padding: '6px 14px', background: '#EDE7FF', color: '#7c3aed', fontFamily: 'var(--font-round)', fontWeight: 900, fontSize: 14, cursor: 'pointer' }}>🔊 Повтори</button>
            ) : null}
            {checkShown && round?.kind === 'check' && <div style={{ fontSize: 56, lineHeight: 1.1, color: '#7c3aed', marginTop: 4 }}>{round.shown}</div>}
          </motion.div>
        )}
      </AnimatePresence>

      {/* зайчик */}
      <div ref={bunnyBox} style={{ position: 'absolute', left: '4%', right: '4%', top: checkShown ? '32%' : '21%', height: 'auto', transition: 'top .3s' }}>
        <PetPuppet pet={pet} face={face} onZone={onZone} bounce={bounce} earFlop={ear} />
      </div>

      {/* кнопки по боках: погладити й полоскотати зліва, спати справа */}
      {mode === 'friend' && (
        <>
          <div style={{ position: 'absolute', left: 10, top: '40%', display: 'flex', flexDirection: 'column', gap: 10, zIndex: 3 }}>
            <SideBtn label="Погладити" onClick={() => onZone('head')}>🤚</SideBtn>
            <SideBtn label="Полоскотати" onClick={() => onZone('belly')}>😄</SideBtn>
          </div>
          <div style={{ position: 'absolute', right: 10, top: '40%', display: 'flex', flexDirection: 'column', gap: 10, zIndex: 3 }}>
            <SideBtn label={face === 'sleep' ? 'Прокинутись' : 'Спати'} onClick={() => (face === 'sleep' ? react('o', 'Доброго ранку!', 1200) : sleep())}>{face === 'sleep' ? '☀️' : '🌙'}</SideBtn>
          </div>
        </>
      )}

      {/* що зайчик уже знає */}
      {known.length > 0 && (
        <div style={{ position: 'absolute', top: '74%', left: 0, right: 0, textAlign: 'center', ...big, fontSize: 13, color: '#8a6a4a' }}>
          {pet.name} уже знає:{' '}
          {known.map((l) => <span key={l} style={{ display: 'inline-block', margin: '0 2px', padding: '1px 7px', borderRadius: 8, background: '#fff', color: '#7c3aed' }}>{l}</span>)}
        </div>
      )}

      {/* низ: морквина або відповіді */}
      <div style={{ position: 'absolute', bottom: '5%', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 12, zIndex: 3 }}>
        {/* кошик: своя їжа друга, стільки, скільки заробила сьогодні; тягнуть до рота */}
        {mode === 'friend' && face !== 'sleep' && left > 0 && Array.from({ length: Math.min(left, 5) }, (_, k) => {
          const f = pet.food[k % pet.food.length];
          return (
            <motion.div key={`${eaten}-${k}`} drag dragSnapToOrigin dragConstraints={zone} dragElastic={0.2} aria-label={f.name}
              onDragEnd={(_, info) => feed(info.point.x - window.scrollX, info.point.y - window.scrollY)}
              whileDrag={{ scale: 1.25, rotate: -15 }}
              style={{ width: 62, height: 62, borderRadius: 20, background: '#fff', display: 'grid', placeItems: 'center', boxShadow: '0 6px 16px -6px rgba(0,0,0,.3)', cursor: 'grab', touchAction: 'none' }}>
              <img src={`/count/${f.img}.webp`} alt="" draggable={false} style={{ width: 46, height: 46, objectFit: 'contain', pointerEvents: 'none' }} />
            </motion.div>
          );
        })}
        {mode === 'friend' && face !== 'sleep' && left === 0 && (
          <motion.button whileTap={{ scale: 0.9 }} aria-label="Кошик порожній"
            onClick={() => react('sad', 'Кошик порожній. Пограй трішки — і я поїм!', 1600, 'smile', undefined, 'pet.hungry')}
            style={{ width: 62, height: 62, borderRadius: 20, border: 0, background: 'rgba(255,255,255,.7)', fontSize: 32, cursor: 'pointer' }}>
            🧺
          </motion.button>
        )}
        {mode === 'teach' && round?.kind === 'find' && round.options.map((l) => (
          <motion.button key={l + round.target} whileTap={{ scale: 0.9 }} onClick={() => answerFind(l)}
            style={{ ...big, width: 78, height: 78, borderRadius: 22, border: 0, background: '#fff', fontSize: 44, color: '#1F2138', boxShadow: '0 6px 16px -6px rgba(0,0,0,.3)', cursor: 'pointer' }}>
            {l}
          </motion.button>
        ))}
        {checkShown && (
          <>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => answerCheck(true)} style={{ ...big, width: 96, height: 72, borderRadius: 22, border: 0, background: '#22C55E', color: '#fff', fontSize: 34, cursor: 'pointer' }}>✓</motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => answerCheck(false)} style={{ ...big, width: 96, height: 72, borderRadius: 22, border: 0, background: '#FF6B6B', color: '#fff', fontSize: 34, cursor: 'pointer' }}>✗</motion.button>
          </>
        )}
      </div>
      {mode === 'friend' && face !== 'sleep' && (
        <div style={{ position: 'absolute', bottom: '17%', left: 0, right: 0, textAlign: 'center', ...big, fontSize: 12.5, color: '#a0846a' }}>Погладь голову · полоскочи пузико · тицьни в носик · нагодуй{left === 0 ? ' — спершу пограй' : ''}</div>
      )}
    </div>
  );
}

function SideBtn({ label, onClick, children }: { label: string; onClick: () => void; children: string }) {
  return (
    <motion.button type="button" aria-label={label} title={label} onClick={onClick} whileTap={{ scale: 0.88 }}
      style={{ width: 52, height: 52, borderRadius: 18, border: 0, background: 'rgba(255,255,255,.92)', boxShadow: '0 4px 0 rgba(160,110,60,.25)', fontSize: 26, cursor: 'pointer' }}>
      {children}
    </motion.button>
  );
}
