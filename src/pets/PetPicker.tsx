import { motion } from 'motion/react';
import { sayUk } from '@/games/shared/uk-audio';
import SleepyBasket from './SleepyBasket';
import { PETS } from './pets';
import { choosePet } from './state';

/**
 * Вибір друга дитиною (концепція v2, 10.10.2026): шість кошиків, з-під ковдрочки визирає верх —
 * дитина вгадує, хто там спить, і обирає. Імен немає: 3-річна не читає, а вгадування — частина радості.
 */
export default function PetPicker({ profileId, onDone }: { profileId: string; onDone: () => void }) {
  const pick = (id: string) => {
    choosePet(profileId, id);
    sayUk('pet.chosen', 'Шшш, твій друг спить. Пограй, і він прокинеться!');
    onDone();
  };
  return (
    <div role="dialog" aria-label="Обери друга" onClick={onDone}
      style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(60,40,20,.35)', display: 'grid', placeItems: 'center', padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 440, background: '#FFF8EE', borderRadius: 32, padding: '18px 14px 20px', boxShadow: '0 12px 40px -12px rgba(0,0,0,.4)' }}>
        <div style={{ fontFamily: 'var(--font-round)', fontWeight: 900, fontSize: 19, textAlign: 'center', color: 'var(--c-ink)', marginBottom: 12 }}>Хто тут спить? Обери свого друга!</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, justifyItems: 'center' }}>
          {Object.values(PETS).map((p) => (
            <motion.button key={p.id} type="button" aria-label={p.name} whileTap={{ scale: 0.92 }} onClick={() => pick(p.id)}
              style={{ border: 0, background: '#fff', borderRadius: 24, padding: 6, cursor: 'pointer', boxShadow: '0 5px 0 #F1E3CF', width: '100%', display: 'grid', placeItems: 'center' }}>
              <SleepyBasket pet={p} size={104} />
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
