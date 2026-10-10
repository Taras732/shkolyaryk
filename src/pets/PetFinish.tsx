import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { sayUk } from '@/games/shared/uk-audio';
import { useProfileStore } from '@/stores/useProfileStore';
import { readLog, localDay } from '@/school/game-log';
import { resolvePlan } from '@/school/plan-resolve';
import { PLACES } from '@/pages/preschool/places';
import PetPuppet from './PetPuppet';
import SleepyBasket from './SleepyBasket';
import { petById } from './pets';
import { getPetChoice, wakePet } from './state';
import type { Face } from '@/pages/poc/Bunny';

/** Чого друг «навчився» в кожному місці — на фініші гри (концепція v2, 10.10.2026). */
export const LEARNED: Record<string, string> = {
  island: 'знаю букви',
  mountain: 'вмію рахувати',
  forest: 'розгадую загадки',
  cave: 'добре запамʼятовую',
  garden: 'знаю про природу',
  cottage: 'розумію почуття',
  meadow: 'співаю',
  workshop: 'майструю',
};
export const learnedLine = (place: string) => `Ням-ням! Тепер я теж трошки ${LEARNED[place] ?? 'вмію'}!`;

type Kind = 'pick' | 'wake' | 'meal' | 'snack' | 'play';

/**
 * Фініш гри дошкілля: як пройдена гра сказалась на друзі.
 * Крок плану → яблучко-знання летить до друга, він їсть і каже, чого навчився (місце гри).
 * Вільна гра → кожна друга дає ласощі в кошик. Друг спав → прокидається. Не обрано → кошик.
 */
function decide(profile: Parameters<typeof resolvePlan>[0], gameId: string): Kind {
  const choice = getPetChoice(profile.id);
  if (!choice.petId) return 'pick';
  if (!choice.awake) return 'wake';
  const day = localDay(Date.now());
  const today = readLog(profile.id).filter((e) => localDay(e.at) === day);
  const plan = resolvePlan(profile).slice(0, 3).map((s) => s.gameId);
  // рахуємо до того, як GameShell запише цю гру в журнал (ефект дитини — раніше)
  if (plan.includes(gameId)) return today.some((e) => e.gameId === gameId) ? 'play' : 'meal';
  const free = today.filter((e) => !plan.includes(e.gameId)).length + 1;
  return free % 2 === 0 && free / 2 <= 2 ? 'snack' : 'play';
}

export default function PetFinish({ gameId }: { gameId: string }) {
  const profile = useProfileStore((s) => s.activeProfile);
  const place = PLACES.find((p) => p.games.includes(gameId) || p.en?.includes(gameId))?.id ?? 'island';
  // що показати — рахуємо раз і БЕЗ побічних дій (StrictMode викликає двічі); будимо окремо, ідемпотентно
  const [kind] = useState<Kind | null>(() => (profile ? decide(profile, gameId) : null));
  const [face, setFace] = useState<Face>('smile');

  useEffect(() => {
    if (!profile || !kind) return;
    const k = kind;
    if (k === 'wake') wakePet(profile.id);
    const t: ReturnType<typeof setTimeout>[] = [];
    if (k === 'wake') { setFace('happy'); t.push(setTimeout(() => sayUk('pet.woke_hi', 'Ура! Привіт! Будемо дружити!'), 500)); }
    if (k === 'meal') { t.push(setTimeout(() => setFace('chew'), 900), setTimeout(() => { setFace('happy'); sayUk(`learn_${place}`, learnedLine(place)); }, 1700)); }
    if (k === 'snack') t.push(setTimeout(() => { setFace('happy'); sayUk('pet.snack', 'Ласощі вже в кошику!'); }, 600));
    if (k === 'play') t.push(setTimeout(() => setFace('happy'), 400));
    if (k === 'pick') t.push(setTimeout(() => sayUk('pet.pick', 'Обери свого друга на головній!'), 600));
    return () => t.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!profile || !kind) return <div style={{ height: 210 }} />;
  const pet = petById(getPetChoice(profile.id).petId);
  const text = kind === 'pick' ? 'Обери свого друга на головній!' : kind === 'wake' ? 'Ура! Привіт! Будемо дружити!'
    : kind === 'meal' ? learnedLine(place) : kind === 'snack' ? 'Ласощі вже в кошику!' : 'Молодець!';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ position: 'relative', width: 190, height: 190 }}>
        {kind === 'pick'
          ? <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}><SleepyBasket size={160} glow /></div>
          : (
            <motion.div initial={kind === 'wake' ? { y: 60, scale: 0.6, opacity: 0 } : false} animate={{ y: 0, scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.2 }}>
              <PetPuppet pet={pet} face={face} onZone={() => setFace('laugh')} />
            </motion.div>
          )}
        {/* яблучко-знання летить до рота */}
        {kind === 'meal' && (
          <motion.span initial={{ x: -90, y: -70, scale: 0.6, opacity: 0 }} animate={{ x: [-90, -20, 0], y: [-70, -40, 10], scale: [0.6, 1, 0.3], opacity: [0, 1, 0] }} transition={{ duration: 1.1, delay: 0.3 }}
            style={{ position: 'absolute', left: '45%', top: '40%', fontSize: 40, pointerEvents: 'none' }}>
            🍎
          </motion.span>
        )}
        {kind === 'snack' && (
          <motion.span initial={{ y: -40, opacity: 0 }} animate={{ y: [-40, 70], opacity: [0, 1, 1, 0] }} transition={{ duration: 1.2 }}
            style={{ position: 'absolute', right: '6%', top: '30%', fontSize: 34, pointerEvents: 'none' }}>
            🧺
          </motion.span>
        )}
      </div>
      <div style={{ fontFamily: 'var(--font-round)', fontWeight: 900, fontSize: kind === 'play' ? 32 : 21, color: 'var(--c-ink)', textAlign: 'center', maxWidth: 320, lineHeight: 1.2 }}>{text}</div>
    </div>
  );
}
