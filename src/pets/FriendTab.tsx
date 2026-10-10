import { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { sayUk } from '@/games/shared/uk-audio';
import type { Face, Zone } from '@/pages/poc/Bunny';
import { useProfileStore } from '@/stores/useProfileStore';
import { readLog, localDay } from '@/school/game-log';
import { resolvePlan } from '@/school/plan-resolve';
import { placeStars } from './skills';
import PetPuppet from './PetPuppet';
import SleepyBasket from './SleepyBasket';
import PetPicker from './PetPicker';
import { petById } from './pets';
import { usePetChoice } from './state';
import { useWakePlay } from './useWakePlay';
import { eatenToday, markEaten, snacksToday, tummyToday, PLAN_FOOD_MAX } from './food';
import { loadGarden, takeFromPantry } from './garden';

/**
 * Вкладка «Друг» (концепція v2, 10.10.2026). Друг учиться з ігор, тож тут — не уроки, а стан і турбота:
 * животик (яблучка-знання за кроки плану, з'їдені на фініші гри), що вміє по місцях (зірочки з пройдених ігор),
 * скільки днів разом; погладити, полоскотати, нагодувати ласощами з кошика, вкласти спати.
 * Режим «Навчи друга» з PoC (`pages/poc/Companion.tsx`) сюди не переносили — рішення Тараса 10.10.
 */
export default function FriendTab() {
  const profile = useProfileStore((s) => s.activeProfile);
  const choice = usePetChoice(profile?.id);
  const [picking, setPicking] = useState(false);
  const wakePlay = useWakePlay();
  if (!profile) return null;
  if (!choice.petId || !choice.awake) {
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '24px 0' }}>
        <button type="button" onClick={() => (choice.petId ? wakePlay() : setPicking(true))}
          aria-label={choice.petId ? 'Друг спить' : 'Обрати друга'} style={{ border: 0, background: 'transparent', cursor: 'pointer' }}>
          <SleepyBasket pet={choice.petId ? petById(choice.petId) : undefined} size={220} glow={!choice.petId} />
        </button>
        <div style={{ fontFamily: 'var(--font-round)', fontWeight: 900, fontSize: 20, textAlign: 'center', color: 'var(--c-ink)', maxWidth: 300 }}>
          {choice.petId ? 'Шшш… друг спить. Пограй — і він прокинеться!' : 'Хтось тут спить! Торкнись кошика й обери свого друга.'}
        </div>
        {choice.petId && (
          <motion.button type="button" whileTap={{ scale: 0.93 }} onClick={() => wakePlay(undefined, 300)}
            style={{ border: 0, borderRadius: 22, padding: '14px 28px', background: '#F08A24', color: '#fff', fontFamily: 'var(--font-round)', fontWeight: 900, fontSize: 20, boxShadow: '0 5px 0 #C2620A', cursor: 'pointer' }}>
            ▶ Пограти
          </motion.button>
        )}
        {picking && <PetPicker profileId={profile.id} onDone={() => setPicking(false)} />}
      </div>
    );
  }
  return <AwakeFriend profileId={profile.id} petId={choice.petId} />;
}

function AwakeFriend({ profileId, petId }: { profileId: string; petId: string }) {
  const pet = petById(petId);
  const profile = useProfileStore((s) => s.activeProfile)!;
  const { tummy, snacks, places, days } = useMemo(() => {
    const log = readLog(profileId);
    const plan = resolvePlan(profile).slice(0, 3).map((s) => s.gameId);
    return {
      tummy: tummyToday(log, plan),
      snacks: snacksToday(log, plan),
      days: new Set(log.map((e) => localDay(e.at))).size,
      places: placeStars(log),
    };
  }, [profileId, profile]);
  const [eaten, setEaten] = useState(() => eatenToday(profileId));
  const left = Math.max(0, snacks - eaten);
  // урожай з «Городу друга» чекає в коморі — теж у кошик (модель «результат живе», 10.10)
  const [pantry, setPantry] = useState(() => loadGarden(profileId).pantry);

  const [face, setFace] = useState<Face>('smile');
  const [bounce, setBounce] = useState(0);
  const [bubble, setBubble] = useState<string | null>(pet.say.hi);
  const zone = useRef<HTMLDivElement>(null);
  const petBox = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = (ms: number, f: () => void) => { timers.current.push(setTimeout(f, ms)); };
  const react = (f: Face, text: string | null, ms: number, key: string) => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setFace(f);
    setBubble(text);
    if (text) sayUk(key, text);
    later(ms, () => setFace('smile'));
  };
  const onZone = (z: Zone) => {
    if (face === 'sleep') { react('o', 'Ой, я спав… Привіт!', 1800, 'pet.woke'); return; }
    if (z === 'nose' || z === 'earL' || z === 'earR') react('o', pet.say.nose, 900, `pet_${pet.id}_nose`);
    if (z === 'belly') { react('laugh', pet.say.belly, 1600, `pet_${pet.id}_belly`); setBounce((b) => b + 1); }
    if (z === 'head') react('happy', pet.say.head, 1600, `pet_${pet.id}_head`);
  };
  const feed = (x: number, y: number) => {
    const r = petBox.current?.getBoundingClientRect();
    if (!r || x < r.left || x > r.right || y < r.top || y > r.bottom) return;
    if (pantry.length) { takeFromPantry(profileId); setPantry((p) => p.slice(1)); } else setEaten(markEaten(profileId));
    react('chew', 'Ням-ням! Смачно!', 1300, 'pet.yum');
    later(1300, () => { setBounce((b) => b + 1); setFace('happy'); });
    later(2800, () => setFace('smile'));
  };
  const sleep = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setFace('sleep');
    setBubble('Добраніч… Завтра пограємо 💤');
    sayUk('poc.sleep', 'Добраніч. Завтра пограємо');
  };
  const big = { fontFamily: 'var(--font-round)', fontWeight: 900 } as const;
  const hungry = tummy < PLAN_FOOD_MAX;

  return (
    <div ref={zone} style={{ position: 'relative', width: '100%', aspectRatio: '9 / 15', maxHeight: '80vh', borderRadius: 28, overflow: 'hidden', background: face === 'sleep' ? 'linear-gradient(#2a2f5a, #4b4f86)' : 'linear-gradient(#fff4dc, #ffe6cf)', transition: 'background .8s', userSelect: 'none', touchAction: 'none' }}>
      {/* стан: животик і скільки днів разом */}
      <div style={{ position: 'absolute', top: 10, left: 10, right: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 4 }}>
        <div aria-label={`Животик: ${tummy} з ${PLAN_FOOD_MAX}`} title="Яблучка-знання за сьогодні"
          style={{ display: 'flex', gap: 2, background: 'rgba(255,255,255,.9)', borderRadius: 99, padding: '4px 10px' }}>
          {Array.from({ length: PLAN_FOOD_MAX }, (_, i) => <span key={i} style={{ fontSize: 20, opacity: i < tummy ? 1 : 0.25, filter: i < tummy ? undefined : 'grayscale(1)' }}>🍎</span>)}
        </div>
        <div style={{ ...big, background: 'rgba(255,255,255,.9)', borderRadius: 99, padding: '6px 12px', fontSize: 13, color: '#8a6a4a' }}>🌱 Малюк · днів разом: {days}</div>
      </div>

      <AnimatePresence mode="wait">
        {bubble && (
          <motion.div key={bubble} initial={{ scale: 0.6, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            style={{ ...big, position: 'absolute', top: '9%', left: '10%', right: '10%', background: '#fff', borderRadius: 20, padding: '9px 14px', fontSize: 16, textAlign: 'center', color: '#1F2138', boxShadow: '0 6px 16px -8px rgba(0,0,0,.3)', zIndex: 3 }}>
            {bubble}
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={petBox} style={{ position: 'absolute', left: '12%', right: '12%', top: '17%' }}>
        <PetPuppet pet={pet} face={face} onZone={onZone} bounce={bounce} />
      </div>

      {/* по боках: погладити, полоскотати — зліва; спати — справа */}
      <div style={{ position: 'absolute', left: 10, top: '34%', display: 'flex', flexDirection: 'column', gap: 10, zIndex: 3 }}>
        <SideBtn label="Погладити" onClick={() => onZone('head')}>🤚</SideBtn>
        <SideBtn label="Полоскотати" onClick={() => onZone('belly')}>😄</SideBtn>
      </div>
      <div style={{ position: 'absolute', right: 10, top: '34%', display: 'flex', flexDirection: 'column', gap: 10, zIndex: 3 }}>
        <SideBtn label={face === 'sleep' ? 'Прокинутись' : 'Спати'} onClick={() => (face === 'sleep' ? react('o', 'Привіт!', 1200, 'pet.hi') : sleep())}>{face === 'sleep' ? '☀️' : '🌙'}</SideBtn>
        {hungry && <SideBtn label="Хочу яблучко" onClick={() => react('o', 'Пограймо «На сьогодні» — там ростуть яблучка!', 2000, 'pet.wantapple')}>🍏</SideBtn>}
      </div>

      {/* що друг уже вміє: місця й зірочки */}
      <div style={{ position: 'absolute', left: 8, right: 8, bottom: '17%', display: 'flex', justifyContent: 'center', gap: 6, zIndex: 3 }}>
        {places.map((p) => (
          <div key={p.id} title={p.title} style={{ width: 50, background: 'rgba(255,255,255,.9)', borderRadius: 14, padding: '4px 2px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {p.image ? <img src={p.image} alt={p.title} style={{ width: 34, height: 34, objectFit: 'contain' }} /> : <span style={{ fontSize: 24 }}>{p.emoji}</span>}
            <span style={{ fontSize: 13, letterSpacing: -1, lineHeight: '15px', color: '#F0A21E' }}>{'★'.repeat(p.stars)}<span style={{ opacity: 0.25 }}>{'★'.repeat(3 - p.stars)}</span></span>
          </div>
        ))}
      </div>

      {/* кошик з ласощами (вільні ігри): своя їжа друга, тягнуть до рота */}
      <div style={{ position: 'absolute', bottom: '3%', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 12, zIndex: 3 }}>
        {face !== 'sleep' && left + pantry.length > 0 && Array.from({ length: Math.min(5, left + pantry.length) }, (_, k) => {
          const f = k < pantry.length ? { img: pantry[k], name: 'урожай' } : pet.food[(k - pantry.length) % pet.food.length];
          return (
            <motion.div key={`${eaten}-${pantry.length}-${k}`} drag dragSnapToOrigin dragConstraints={zone} dragElastic={0.2} aria-label={f.name}
              onDragEnd={(_, info) => feed(info.point.x - window.scrollX, info.point.y - window.scrollY)}
              whileDrag={{ scale: 1.25, rotate: -15 }}
              style={{ width: 60, height: 60, borderRadius: 20, background: '#fff', display: 'grid', placeItems: 'center', boxShadow: '0 6px 16px -6px rgba(0,0,0,.3)', cursor: 'grab', touchAction: 'none' }}>
              <img src={`/count/${f.img}.webp`} alt="" draggable={false} style={{ width: 44, height: 44, objectFit: 'contain', pointerEvents: 'none' }} />
            </motion.div>
          );
        })}
        {face !== 'sleep' && left + pantry.length === 0 && (
          <motion.button whileTap={{ scale: 0.9 }} aria-label="Кошик з ласощами порожній"
            onClick={() => react('o', 'Ласощі зʼявляються за ігри. Пограй ще трішки!', 1800, 'pet.nosnack')}
            style={{ width: 60, height: 60, borderRadius: 20, border: 0, background: 'rgba(255,255,255,.7)', fontSize: 30, cursor: 'pointer' }}>
            🧺
          </motion.button>
        )}
      </div>
    </div>
  );
}

function SideBtn({ label, onClick, children }: { label: string; onClick: () => void; children: string }) {
  return (
    <motion.button type="button" aria-label={label} title={label} onClick={onClick} whileTap={{ scale: 0.88 }}
      style={{ width: 50, height: 50, borderRadius: 18, border: 0, background: 'rgba(255,255,255,.92)', boxShadow: '0 4px 0 rgba(160,110,60,.25)', fontSize: 24, cursor: 'pointer' }}>
      {children}
    </motion.button>
  );
}
