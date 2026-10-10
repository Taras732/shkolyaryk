import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Difficulty, GameComponentProps, LevelData } from '../types';
import { BOARD_DONE } from '../types';
import { shuffle } from '../shared/ui';
import { sayUk } from '../shared/uk-audio';
import { TaskBubble } from '../shared/preschool';
import PetPuppet from '@/pets/PetPuppet';
import { usePet } from '@/pets/pets';
import { useProfileStore } from '@/stores/useProfileStore';
import { addSticker } from '@/pets/album';
import { KID_ITEMS } from './kids';

/**
 * «Пліт для друга» v2 (10.10.2026, після рев'ю: «погано виглядає»): намальований ставок на весь екран,
 * великі речі, сплеск і похитування; що плаває — підпливає до плоту з дощок, що тоне — йде на дно з бульбашками.
 * Три на плоту — друг стрибає на пліт і пливе до другого берега.
 * Рівні: 1 — 5 речей (4 плавають), 2 — 6 (3/3), 3 — 7 (3/4).
 */
export interface RaftP { kid: true; raft: true; items: string[] }
const NEED = 3;
const RAFT = { x: 46, y: 50 }; // центр плоту, % сцени
const SHORE = { x: 78, y: 30 };

export function generateRaft(d: Difficulty): LevelData<RaftP, typeof BOARD_DONE> {
  const floats = shuffle(KID_ITEMS.filter((x) => x.floats).map((x) => x.id));
  const sinks = shuffle(KID_ITEMS.filter((x) => !x.floats).map((x) => x.id));
  const [f, s] = d === 1 ? [4, 1] : d === 2 ? [3, 3] : [3, 4];
  return { difficulty: d, rounds: [{ id: `raft-${Date.now()}`, payload: { kid: true, raft: true, items: shuffle([...floats.slice(0, f), ...sinks.slice(0, s)]) }, answer: BOARD_DONE }] };
}

interface Drop { id: string; x: number; y: number; floats: boolean; slot: number; at: number }

export function RaftBoard({ round, onAnswer, onMistake }: GameComponentProps<RaftP, typeof BOARD_DONE>) {
  const pet = usePet();
  const profileId = useProfileStore((s) => s.activeProfile?.id);
  const scene = useRef<HTMLDivElement>(null);
  const [drops, setDrops] = useState<Drop[]>([]);
  const [phase, setPhase] = useState<'build' | 'board' | 'sail'>('build');
  const onRaft = drops.filter((d) => d.floats);
  const [settled, setSettled] = useState<Set<number>>(new Set());
  const [moving, setMoving] = useState<Set<number>>(new Set());

  useEffect(() => {
    const t = window.setTimeout(() => sayUk('raft.hello', 'Друг хоче на той берег! Кидай у воду — що плаває, стане плотом.'), 400);
    return () => window.clearTimeout(t);
  }, []);

  const drop = (id: string, cx: number, cy: number) => {
    const r = scene.current?.getBoundingClientRect();
    if (!r || phase !== 'build') return;
    const x = ((cx - r.left) / r.width) * 100;
    const y = ((cy - r.top) / r.height) * 100;
    if (x < 0 || x > 100 || y < 30 || y > 100) return; // лише у воду
    const item = KID_ITEMS.find((i) => i.id === id)!;
    const at = Date.now();
    const slot = item.floats ? onRaft.length : -1;
    setDrops((a) => [...a, { id, x, y: Math.min(80, Math.max(42, y)), floats: item.floats, slot, at }]);
    addSticker(profileId, 'finds', id);
    if (item.floats) {
      window.setTimeout(() => setMoving((s) => new Set(s).add(at)), 350);
      window.setTimeout(() => setSettled((s) => new Set(s).add(at)), 950);
      const n = onRaft.length + 1;
      sayUk(n >= NEED ? 'raft.done' : 'raft.float', n >= NEED ? 'Пліт готовий! Пливемо!' : 'Плаває! Беремо на пліт.');
      if (n >= NEED) {
        window.setTimeout(() => setPhase('board'), 1300);
        window.setTimeout(() => setPhase('sail'), 2300);
        window.setTimeout(() => onAnswer(BOARD_DONE), 6200);
      }
    } else {
      onMistake();
      sayUk('raft.sink', 'Бульк — потонуло!');
    }
  };

  const left = round.payload.items.filter((id) => !drops.some((d) => d.id === id));
  const sail = phase === 'sail';
  const raftPos = sail ? SHORE : RAFT;
  const planks = Math.max(1, Math.min(NEED, onRaft.filter((d) => settled.has(d.at)).length));

  return (
    <TaskBubble text="Пліт для друга" onSay={() => sayUk('raft.hello', 'Друг хоче на той берег! Кидай у воду — що плаває, стане плотом.')} peek={false} sceneBg="#DFF1FF">
      <style>{`
        @keyframes rf-bob { 0%,100% { transform: translateY(0) rotate(-3deg) } 50% { transform: translateY(-5px) rotate(3deg) } }
        @keyframes rf-sink { 0% { transform: translateY(0); opacity: 1 } 100% { transform: translateY(70px); opacity: 0 } }
        @keyframes rf-bubble { 0% { transform: translateY(0); opacity: .9 } 100% { transform: translateY(-40px); opacity: 0 } }
      `}</style>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, position: 'relative', zIndex: 1 }}>
        <div ref={scene} style={{ position: 'relative', width: '100%', maxWidth: 400, aspectRatio: '1', borderRadius: 26, overflow: 'hidden', boxShadow: '0 6px 0 #BCD9EE' }}>
          <img src="/count/sea_pond.webp" alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />

          {/* пліт: дошки ростуть з кожною річчю, що плаває; потім пливе до берега */}
          {/* CSS-переходи по left/top: Motion з відсотками left/top ненадійний (лабіринт, морозиво) */}
          <div style={{ position: 'absolute', left: `${raftPos.x}%`, top: `${raftPos.y}%`, width: 0, height: 0, transition: `left ${sail ? 3.4 : 0.6}s ease-in-out, top ${sail ? 3.4 : 0.6}s ease-in-out` }}>
            <div style={{ position: 'absolute', left: -planks * 26, top: 18, width: planks * 52, height: 20, borderRadius: 8, background: 'repeating-linear-gradient(90deg, #B07A3C 0 16px, #8B5A2B 16px 18px)', boxShadow: '0 4px 0 rgba(0,0,0,.2)', opacity: onRaft.length ? 1 : 0 }} />
            {onRaft.map((d) => settled.has(d.at) && (
              <img key={d.at} src={`/count/${d.id}.webp`} alt="" draggable={false}
                style={{ position: 'absolute', left: (d.slot - (planks - 1) / 2) * 48 - 32, top: -38, width: 64, height: 64, objectFit: 'contain', animation: 'rf-bob 1.8s ease-in-out infinite' }} />
            ))}
            {phase !== 'build' && (
              <motion.div initial={{ x: -170, y: -120, scale: 0.9 }} animate={{ x: -50, y: -112, scale: 1 }} transition={{ type: 'spring', stiffness: 120, damping: 12 }}
                style={{ position: 'absolute', width: 100 }}>
                <PetPuppet pet={pet} face="laugh" onZone={() => {}} />
              </motion.div>
            )}
          </div>

          {/* друг чекає на березі */}
          {phase === 'build' && (
            <div style={{ position: 'absolute', left: '2%', top: '6%', width: '30%', pointerEvents: 'none' }}>
              <PetPuppet pet={pet} face={onRaft.length ? 'happy' : 'smile'} onZone={() => {}} />
            </div>
          )}

          {/* щойно кинуте: сплеск; що плаває — підпливає до плоту; що тоне — на дно з бульбашками */}
          <AnimatePresence>
            {drops.filter((d) => !settled.has(d.at)).map((d) => (
              <motion.div key={d.at} exit={{ opacity: 0 }}
                style={{ position: 'absolute', width: 0, height: 0, transition: 'left .55s ease-in-out, top .55s ease-in-out',
                  left: `${d.floats && moving.has(d.at) ? RAFT.x : d.x}%`, top: `${d.floats && moving.has(d.at) ? RAFT.y - 8 : d.y}%` }}>
                <span style={{ position: 'absolute', left: -26, top: -20, fontSize: 34, animation: 'rf-bubble .7s ease-out forwards' }}>💦</span>
                <img src={`/count/${d.id}.webp`} alt="" draggable={false}
                  style={{ position: 'absolute', left: -34, top: -34, width: 68, height: 68, objectFit: 'contain', animation: d.floats ? 'rf-bob 1s ease-in-out infinite' : 'rf-sink 1.6s ease-in forwards' }} />
                {!d.floats && [0, 1, 2].map((k) => (
                  <span key={k} style={{ position: 'absolute', left: -10 + k * 10, top: 10, fontSize: 16, animation: `rf-bubble 1s ease-out ${0.3 + k * 0.25}s infinite` }}>🫧</span>
                ))}
              </motion.div>
            ))}
          </AnimatePresence>

          <div style={{ position: 'absolute', right: 10, top: 10, fontFamily: 'var(--font-round)', fontWeight: 900, fontSize: 18, background: 'rgba(255,255,255,.9)', borderRadius: 99, padding: '4px 10px' }}>
            {Array.from({ length: NEED }, (_, k) => <span key={k} style={{ opacity: k < onRaft.length ? 1 : 0.25 }}>🪵</span>)}
          </div>
        </div>

        {/* речі на березі: тягни у воду */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', maxWidth: 400 }}>
          {left.map((id) => (
            <motion.div key={id} drag dragSnapToOrigin whileDrag={{ scale: 1.25, zIndex: 5 }} aria-label={KID_ITEMS.find((x) => x.id === id)!.name}
              onDragEnd={(_, info) => drop(id, info.point.x - window.scrollX, info.point.y - window.scrollY)}
              style={{ width: 78, height: 78, borderRadius: 22, background: '#fff', boxShadow: '0 5px 0 #F1E3CF', display: 'grid', placeItems: 'center', cursor: 'grab', touchAction: 'none' }}>
              <img src={`/count/${id}.webp`} alt="" draggable={false} style={{ width: 60, height: 60, objectFit: 'contain', pointerEvents: 'none' }} />
            </motion.div>
          ))}
        </div>
        {phase === 'build' && onRaft.length < NEED && left.length === 0 && (
          <button type="button" onClick={() => onAnswer(BOARD_DONE)} style={{ border: 0, borderRadius: 18, padding: '10px 22px', background: '#F08A24', color: '#fff', fontFamily: 'var(--font-round)', fontWeight: 900, fontSize: 16, cursor: 'pointer' }}>Готово</button>
        )}
      </div>
    </TaskBubble>
  );
}
