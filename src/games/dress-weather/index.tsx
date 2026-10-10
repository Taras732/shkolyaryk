import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import type { Difficulty, GameComponentProps, GameDefinition, LevelData } from '../types';
import { shuffle } from '../shared/ui';
import { sayUk } from '../shared/uk-audio';
import { SceneTask } from '../shared/count-ui';
import PetPuppet from '@/pets/PetPuppet';
import { usePet } from '@/pets/pets';
import { useProfileStore } from '@/stores/useProfileStore';
import { addToWardrobe } from '@/pets/wardrobe';

/**
 * «Що вдягнути?» (10.10.2026, модель «результат живе»): анімована погода, друг надворі; дитина обирає річ —
 * вона з'являється на другові й лягає в його шафу (звідти — «Одягни друга» в Майстерні).
 * Вчить не лише назвати погоду, а й що з нею робити.
 */
export const WEATHER = {
  sunny: { say: 'Сонечко пече!', img: '/count/sea_sunny.webp', wear: ['wear_sunhat', 'wear_sunglasses'] },
  rainy: { say: 'Іде дощик!', img: '/count/sea_rainy.webp', wear: ['as_umbrella', 'wear_boots'] },
  snowy: { say: 'Падає сніг!', img: '/count/sea_snowy.webp', wear: ['wear_winterhat', 'wear_scarf'] },
  windy: { say: 'Дме вітер!', img: '/count/sea_windy.webp', wear: ['wear_jacket'] },
} as const;
type W = keyof typeof WEATHER;
const ALL = Object.values(WEATHER).flatMap((w) => w.wear as readonly string[]);

interface P { weather: W; options: string[] }

function generate(d: Difficulty): LevelData<P, string> {
  const ws = Object.keys(WEATHER) as W[];
  const order = [...shuffle(ws), shuffle(ws)[0]];
  const n = d === 1 ? 2 : d === 2 ? 3 : 4;
  return {
    difficulty: d,
    rounds: order.slice(0, 5).map((w, i) => {
      const right = shuffle([...WEATHER[w].wear])[0];
      const wrong = shuffle(ALL.filter((x) => !(WEATHER[w].wear as readonly string[]).includes(x))).slice(0, n - 1);
      return { id: `r${i}`, payload: { weather: w, options: shuffle([right, ...wrong]) }, answer: right };
    }),
  };
}

/** Дощ і сніг — падають; вітер — летять листочки; сонце — промені пульсують. */
function WeatherFx({ w }: { w: W }) {
  const drops = useMemo(() => Array.from({ length: 18 }, (_, i) => ({ x: (i * 53) % 100, d: (i % 6) * 0.25, s: 0.9 + (i % 4) * 0.2 })), []);
  if (w === 'sunny')
    return <motion.div animate={{ opacity: [0.15, 0.4, 0.15] }} transition={{ duration: 2.4, repeat: Infinity }}
      style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 75% 15%, #FFE58A 0%, rgba(255,229,138,0) 55%)', pointerEvents: 'none' }} />;
  // CSS по top/left: відсотки в transform рахуються від розміру самої краплі, не сцени
  const dur = (s: number) => (w === 'rainy' ? 0.9 * s : w === 'snowy' ? 4 * s : 2.2 * s);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <style>{`@keyframes dw-fall{from{top:-8%}to{top:104%}} @keyframes dw-blow{from{left:-8%;transform:rotate(0)}to{left:106%;transform:rotate(360deg)}}`}</style>
      {drops.map((p, i) => (
        <span key={i}
          style={{ position: 'absolute', left: w === 'windy' ? '-8%' : `${p.x}%`, top: w === 'windy' ? `${10 + ((i * 37) % 70)}%` : '-8%',
            animation: `${w === 'windy' ? 'dw-blow' : 'dw-fall'} ${dur(p.s)}s linear ${p.d}s infinite`,
            fontSize: w === 'rainy' ? 14 : 18, opacity: 0.85 }}>
          {w === 'rainy' ? '💧' : w === 'snowy' ? '❄️' : '🍂'}
        </span>
      ))}
    </div>
  );
}

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<P, string>) {
  const pet = usePet();
  const profileId = useProfileStore((s) => s.activeProfile?.id);
  const { weather, options } = round.payload;
  const w = WEATHER[weather];
  const [worn, setWorn] = useState<string | null>(null);
  useEffect(() => { setWorn(null); }, [round.id]);
  // погода — щораунду своя, тож фраза погоди і є ціль; загальне питання — лише на першому раунді
  const say = (again?: boolean) => {
    if (!again && round.id === 'r0') sayUk('dw_q', 'Що вдягнути другові?');
    window.setTimeout(() => sayUk(`dw_${weather}`, w.say), !again && round.id === 'r0' ? 1600 : 0);
  };
  const pick = (id: string) => {
    if (disabled) return;
    const ok = (w.wear as readonly string[]).includes(id);
    if (ok) { setWorn(id); if (profileId) addToWardrobe(profileId, id); }
    onAnswer(ok ? round.answer : id);
  };
  return (
    <SceneTask question={w.say} say={say} sayKey={round.id} peek={false} sceneBg="#EAF4FF">
      <div style={{ position: 'absolute', inset: 12, borderRadius: 26, overflow: 'hidden' }}>
        <img src={w.img} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }} />
        <WeatherFx w={weather} />
        <div style={{ position: 'absolute', left: '50%', bottom: '24%', width: 170, transform: 'translateX(-50%)' }}>
          <PetPuppet pet={pet} face={answerState === 'correct' ? 'laugh' : answerState === 'incorrect' ? 'sad' : 'smile'} onZone={() => {}} />
          {worn && (
            <motion.img src={`/count/${worn}.webp`} alt="" initial={{ scale: 0, y: -60 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 14 }}
              style={{ position: 'absolute', right: -40, top: -10, width: 86, height: 86, objectFit: 'contain', filter: 'drop-shadow(0 3px 2px rgba(0,0,0,.25))' }} />
          )}
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 10, display: 'flex', justifyContent: 'center', gap: 10 }}>
          {options.map((id) => (
            <motion.button key={id} type="button" aria-label={id} disabled={disabled} whileTap={{ scale: 0.9 }} onClick={() => pick(id)}
              style={{ width: 72, height: 72, border: 0, borderRadius: 20, background: '#fff', boxShadow: '0 5px 0 rgba(0,0,0,.15)', cursor: 'pointer', display: 'grid', placeItems: 'center', padding: 8 }}>
              <img src={`/count/${id}.webp`} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </motion.button>
          ))}
        </div>
      </div>
    </SceneTask>
  );
}

const dressWeather: GameDefinition<P, string> = {
  id: 'dress-weather',
  title: 'Що вдягнути?',
  subject: 'science',
  levels: ['L0'],
  icon: '☂️',
  image: '/count/sea_rainy.webp',
  description: 'Яка погода — що вдягнути другові.',
  accent: '#E0F2FE',
  generate,
  // правильна будь-яка річ під цю погоду (у дощ — і парасолька, і чоботи)
  isCorrect: (round, answer) => (WEATHER[round.payload.weather].wear as readonly string[]).includes(answer) || answer === round.answer,
  Component,
};

export default dressWeather;
