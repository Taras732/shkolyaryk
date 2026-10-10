import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import type { Difficulty, GameComponentProps, GameDefinition, LevelData } from '../types';
import { sayUk } from '../shared/uk-audio';
import { SceneTask } from '../shared/count-ui';
import PetPuppet from '@/pets/PetPuppet';
import { usePet } from '@/pets/pets';

/**
 * Музична Поляна (10.10.2026, варіант Б): «Повтори за другом» — чотири кольорові пластинки ксилофона;
 * друг грає мелодію (пластинки світяться), дитина повторює. Рівні: 2 → 3 → 4 ноти. Помилка — друг грає ще раз.
 * Звук — синтез у браузері (WebAudio), без файлів.
 */
const BARS = [
  { color: '#EF4444', freq: 523.25 }, // до
  { color: '#F59E0B', freq: 587.33 }, // ре
  { color: '#22C55E', freq: 659.25 }, // мі
  { color: '#3B82F6', freq: 783.99 }, // соль
];
export const DONE = 'done';

let ctx: AudioContext | null = null;
function ding(freq: number) {
  try {
    ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.65);
  } catch {
    // без звуку — пластинки однаково світяться
  }
}

interface P { seq: number[] }
function generate(d: Difficulty): LevelData<P, string> {
  const len = d === 1 ? 2 : d === 2 ? 3 : 4;
  return {
    difficulty: d,
    rounds: Array.from({ length: 5 }, (_, i) => {
      const seq: number[] = [];
      while (seq.length < len) { const n = Math.floor(Math.random() * 4); if (n !== seq[seq.length - 1]) seq.push(n); }
      return { id: `r${i}`, payload: { seq }, answer: DONE };
    }),
  };
}

function Component({ round, disabled, onAnswer, onMistake }: GameComponentProps<P, string>) {
  const pet = usePet();
  const { seq } = round.payload;
  const [lit, setLit] = useState<number | null>(null);
  const [playing, setPlaying] = useState(true);
  const [pos, setPos] = useState(0);
  const timers = useRef<number[]>([]);

  const playSeq = (delay = 600) => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPlaying(true);
    setPos(0);
    seq.forEach((n, k) => {
      timers.current.push(window.setTimeout(() => { setLit(n); ding(BARS[n].freq); }, delay + k * 700));
      timers.current.push(window.setTimeout(() => setLit(null), delay + k * 700 + 420));
    });
    timers.current.push(window.setTimeout(() => setPlaying(false), delay + seq.length * 700));
  };
  useEffect(() => {
    if (round.id === 'r0') sayUk('xylo.hello', 'Послухай і повтори за мною!');
    playSeq(round.id === 'r0' ? 2200 : 700);
    return () => timers.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round.id]);

  const tap = (n: number) => {
    if (disabled || playing) return;
    setLit(n); ding(BARS[n].freq);
    window.setTimeout(() => setLit(null), 250);
    if (n !== seq[pos]) { onMistake(); window.setTimeout(() => playSeq(500), 400); return; }
    if (pos + 1 === seq.length) { setPlaying(true); window.setTimeout(() => onAnswer(DONE), 400); return; }
    setPos(pos + 1);
  };

  return (
    <SceneTask question="Повтори за другом 🎵" say={() => playSeq(300)} sayKey={`${round.id}-x`} peek={false}
      sceneBg="linear-gradient(180deg, #E0F2FE 0%, #F0F9FF 62%, #D9F2C9 62%, #C7E8B0 100%)">
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, position: 'relative', zIndex: 1 }}>
        <div style={{ width: 150, pointerEvents: 'none' }}><PetPuppet pet={pet} face={playing ? 'happy' : 'smile'} onZone={() => {}} /></div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', padding: '12px 14px', background: '#A86E33', borderRadius: 18, boxShadow: '0 6px 0 #7A4E22' }}>
          {BARS.map((b, n) => (
            <motion.button key={n} type="button" aria-label={`Пластинка ${n + 1}`} onClick={() => tap(n)} whileTap={{ scale: 0.95 }}
              animate={{ y: lit === n ? 6 : 0, filter: lit === n ? 'brightness(1.35)' : 'brightness(1)' }}
              style={{ width: 58, height: 150 - n * 18, border: 0, borderRadius: 14, background: b.color, cursor: playing ? 'default' : 'pointer',
                boxShadow: lit === n ? `0 0 22px 6px ${b.color}` : '0 4px 0 rgba(0,0,0,.25)' }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {seq.map((_, k) => <span key={k} style={{ width: 14, height: 14, borderRadius: '50%', background: k < pos ? '#22C55E' : '#E5D7C3' }} />)}
        </div>
      </div>
    </SceneTask>
  );
}

const xylophoneRepeat: GameDefinition<P, string> = {
  id: 'xylophone-repeat',
  title: 'Повтори за другом',
  subject: 'memory',
  levels: ['L0'],
  icon: '🎶',
  description: 'Друг грає мелодію — повтори.',
  accent: '#E0F2FE',
  generate,
  Component,
};

export default xylophoneRepeat;
