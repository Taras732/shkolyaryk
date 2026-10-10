import { motion } from 'motion/react';
import PuppetBunny from '@/pages/poc/PuppetBunny';
import type { Face, Zone } from '@/pages/poc/Bunny';
import type { Pet } from './pets';

/**
 * Друг на екрані. Зайчик — лялька з шарів (моргає, вушка); решта звірят — поки ціла картинка,
 * яка так само реагує (підскок, хитання, «жує», спить). Шари для всіх шести — крок 2 концепції.
 */
export default function PetPuppet({ pet, face, onZone, bounce = 0, earFlop }: { pet: Pet; face: Face; onZone: (z: Zone) => void; bounce?: number; earFlop?: 'L' | 'R' | null }) {
  if (pet.id === 'rabbit') return <PuppetBunny face={face} onZone={onZone} bounce={bounce} earFlop={earFlop} />;
  const joy = face === 'happy' || face === 'laugh';
  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '1' }}>
      <motion.img key={bounce} src={pet.full} alt={pet.name} draggable={false}
        onPointerDown={(e) => {
          // верхня третина — «голова», решта — «живіт»: реакції ті самі, що в ляльки
          const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
          onZone((e.clientY - r.top) / r.height < 0.38 ? 'head' : 'belly');
        }}
        initial={{ y: 0, scale: 1 }}
        animate={face === 'chew' ? { scale: [1, 1.05, 1, 1.05, 1] } : joy ? { rotate: [0, -6, 6, -4, 0], y: [0, -14, 0] } : { y: [0, -10, 0] }}
        transition={{ duration: face === 'chew' ? 0.9 : 0.6 }}
        style={{ width: '100%', height: '100%', objectFit: 'contain', cursor: 'pointer', opacity: face === 'sleep' ? 0.82 : 1,
          filter: face === 'sleep' ? 'saturate(.7)' : undefined, touchAction: 'none' }} />
      {face === 'sleep' && <span style={{ position: 'absolute', top: '6%', right: '10%', fontSize: 26 }}>💤</span>}
    </div>
  );
}
