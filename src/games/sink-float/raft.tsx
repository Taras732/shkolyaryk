import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
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
 * «Пліт для друга» (10.10.2026, після рев'ю Тараса: кнопки «плаває/тоне» — нецікаво): дослід руками.
 * Друг хоче через ставок — потрібен пліт із 3 речей, що плавають. Дитина перетягує речі у воду:
 * що плаває — лишається на поверхні й стає плотом, що тоне — падає на дно. Три — пліт готовий, друг пливе.
 * Рівні: 1 — 5 речей (з них 3–4 плавають), 2 — 6, 3 — 7 (більше тих, що тонуть).
 */
export interface RaftP { kid: true; raft: true; items: string[] }
const NEED = 3;

export function generateRaft(d: Difficulty): LevelData<RaftP, typeof BOARD_DONE> {
  const floats = shuffle(KID_ITEMS.filter((x) => x.floats).map((x) => x.id));
  const sinks = shuffle(KID_ITEMS.filter((x) => !x.floats).map((x) => x.id));
  const [f, s] = d === 1 ? [4, 1] : d === 2 ? [3, 3] : [3, 4];
  return { difficulty: d, rounds: [{ id: `raft-${Date.now()}`, payload: { kid: true, raft: true, items: shuffle([...floats.slice(0, f), ...sinks.slice(0, s)]) }, answer: BOARD_DONE }] };
}

export function RaftBoard({ round, onAnswer, onMistake }: GameComponentProps<RaftP, typeof BOARD_DONE>) {
  const pet = usePet();
  const profileId = useProfileStore((s) => s.activeProfile?.id);
  const pond = useRef<HTMLDivElement>(null);
  const [inWater, setInWater] = useState<{ id: string; x: number; floats: boolean }[]>([]);
  const [sail, setSail] = useState(false);
  const raft = inWater.filter((w) => w.floats);
  useEffect(() => {
    const t = window.setTimeout(() => sayUk('raft.hello', 'Друг хоче на той берег! Кидай у воду — що плаває, стане плотом.'), 400);
    return () => window.clearTimeout(t);
  }, []);

  const drop = (id: string, clientX: number, clientY: number) => {
    const r = pond.current?.getBoundingClientRect();
    if (!r || clientY < r.top || clientY > r.bottom || clientX < r.left || clientX > r.right || sail) return;
    const item = KID_ITEMS.find((x) => x.id === id)!;
    setInWater((a) => [...a, { id, x: Math.min(0.85, Math.max(0.1, (clientX - r.left) / r.width)), floats: item.floats }]);
    addSticker(profileId, 'finds', id);
    if (item.floats) {
      const n = raft.length + 1;
      sayUk(n >= NEED ? 'raft.done' : 'raft.float', n >= NEED ? 'Пліт готовий! Пливемо!' : 'Плаває! Беремо на пліт.');
      if (n >= NEED) { window.setTimeout(() => setSail(true), 700); window.setTimeout(() => onAnswer(BOARD_DONE), 4200); }
    } else {
      onMistake();
      sayUk('raft.sink', 'Бульк — потонуло!');
    }
  };

  const left = round.payload.items.filter((id) => !inWater.some((w) => w.id === id));
  return (
    <TaskBubble text="Пліт для друга" onSay={() => sayUk('raft.hello', 'Друг хоче на той берег! Кидай у воду — що плаває, стане плотом.')} peek={false} sceneBg="#EAF6FF">
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, position: 'relative', zIndex: 1 }}>
        {/* ставок: берег зліва з другом, вода, берег справа */}
        <div ref={pond} style={{ position: 'relative', width: '100%', maxWidth: 380, height: 290, borderRadius: 24, overflow: 'hidden', background: 'linear-gradient(#BFE6FF 0 30%, #7CC4F5 30% 100%)' }}>
          <div style={{ position: 'absolute', left: 0, top: '22%', bottom: 0, width: '16%', background: '#9CD07A', borderRadius: '0 30px 0 0' }} />
          <div style={{ position: 'absolute', right: 0, top: '22%', bottom: 0, width: '16%', background: '#9CD07A', borderRadius: '30px 0 0 0' }} />
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '12%', background: '#E8C98F' }} />
          {/* у воді: що плаває — на поверхні, що тоне — на дні (CSS по top: Motion з відсотками top ненадійний) */}
          <style>{`@keyframes raft-float{from{top:0%}to{top:24%}} @keyframes raft-sink{from{top:0%}to{top:78%}}`}</style>
          {inWater.map((w, k) => {
            const onRaft = w.floats ? raft.findIndex((r) => r === w) : -1;
            return (
              <motion.img key={`${w.id}-${k}`} src={`/count/${w.id}.webp`} alt="" draggable={false}
                animate={sail && w.floats ? { x: ['0%', '520%'] } : { x: '0%' }}
                transition={{ duration: 3, ease: 'easeInOut' }}
                style={{ position: 'absolute', left: sail && w.floats ? `${18 + onRaft * 9}%` : `${w.x * 100 - 6}%`, width: 54, height: 54, objectFit: 'contain', pointerEvents: 'none',
                  animation: `${w.floats ? 'raft-float .6s' : 'raft-sink 1.2s'} ease-out forwards` }} />
            );
          })}
          {/* друг на березі, а коли пліт готовий — пливе */}
          <motion.div animate={sail ? { x: [0, 250], y: [0, 26, 26] } : { x: 0 }} transition={{ duration: 3, ease: 'easeInOut' }}
            style={{ position: 'absolute', left: 2, top: '2%', width: 76, pointerEvents: 'none' }}>
            <PetPuppet pet={pet} face={sail ? 'laugh' : 'smile'} onZone={() => {}} />
          </motion.div>
          <div style={{ position: 'absolute', right: 10, top: 8, fontFamily: 'var(--font-round)', fontWeight: 900, fontSize: 16, background: '#fff', borderRadius: 99, padding: '4px 10px' }}>
            {'🪵'.repeat(Math.min(raft.length, NEED))}<span style={{ opacity: 0.3 }}>{'🪵'.repeat(Math.max(0, NEED - raft.length))}</span>
          </div>
        </div>
        {/* речі на березі: тягни у воду */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 380 }}>
          {left.map((id) => (
            <motion.div key={id} drag dragSnapToOrigin whileDrag={{ scale: 1.2, zIndex: 5 }} aria-label={KID_ITEMS.find((x) => x.id === id)!.name}
              onDragEnd={(_, info) => drop(id, info.point.x - window.scrollX, info.point.y - window.scrollY)}
              style={{ width: 66, height: 66, borderRadius: 18, background: '#fff', boxShadow: '0 4px 0 #F1E3CF', display: 'grid', placeItems: 'center', cursor: 'grab', touchAction: 'none' }}>
              <img src={`/count/${id}.webp`} alt="" draggable={false} style={{ width: 50, height: 50, objectFit: 'contain', pointerEvents: 'none' }} />
            </motion.div>
          ))}
        </div>
        {!sail && raft.length < NEED && left.length > 0 && <div style={{ fontFamily: 'var(--font-round)', fontWeight: 800, fontSize: 13, color: '#8a6a4a' }}>Перетягни річ у воду</div>}
        {!sail && raft.length < NEED && left.length === 0 && (
          <button type="button" onClick={() => onAnswer(BOARD_DONE)} style={{ border: 0, borderRadius: 18, padding: '10px 22px', background: '#F08A24', color: '#fff', fontFamily: 'var(--font-round)', fontWeight: 900, fontSize: 16, cursor: 'pointer' }}>Готово</button>
        )}
      </div>
    </TaskBubble>
  );
}
