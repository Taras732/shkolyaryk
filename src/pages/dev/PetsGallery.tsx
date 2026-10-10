import { useState } from 'react';
import PetPuppet from '@/pets/PetPuppet';
import { PETS } from '@/pets/pets';
import type { Face, Zone } from '@/pages/poc/Bunny';

/** DEV: усі друзі разом — перевірити розмітку очей і рота, обличчя й дотики (10.10.2026). */
const FACES: Face[] = ['smile', 'happy', 'laugh', 'o', 'chew', 'sad', 'sleep'];

export default function PetsGallery() {
  const [face, setFace] = useState<Face>('smile');
  const [last, setLast] = useState<Record<string, Zone>>({});
  return (
    <div style={{ minHeight: '100dvh', background: '#FFF8EE', padding: 16, fontFamily: 'var(--font-round)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {FACES.map((f) => (
          <button key={f} onClick={() => setFace(f)} style={{ border: 0, borderRadius: 12, padding: '8px 12px', fontWeight: 900, background: f === face ? '#F08A24' : '#fff', color: f === face ? '#fff' : '#7a5a3a', cursor: 'pointer' }}>{f}</button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
        {Object.values(PETS).map((p) => (
          <div key={p.id} style={{ background: p.color, borderRadius: 20, padding: 8, textAlign: 'center' }}>
            <PetPuppet pet={p} face={face} onZone={(z) => setLast((l) => ({ ...l, [p.id]: z }))} />
            <div style={{ fontWeight: 900 }}>{p.name}</div>
            <div style={{ fontSize: 12, color: '#7a5a3a' }}>дотик: {last[p.id] ?? '—'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
