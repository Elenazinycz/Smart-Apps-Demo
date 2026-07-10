'use client';

import { useState, useEffect } from 'react';

type Zuordnung = {
  id: string;
  onlineErlaubt: boolean;
  aktiv: boolean;
  bemerkung: string | null;
  arzt: { id: string; name: string };
  terminTyp: { id: string; bezeichnung: string; dauerStandardMinuten: number };
};

export default function ZuordnungPage() {
  const [zuordnungen, setZuordnungen] = useState<Zuordnung[]>([]);
  const [lade, setLade] = useState(true);
  const [melding, setMelding] = useState('');

  useEffect(() => {
    fetch('/api/zuordnungen')
      .then(r => r.json())
      .then(d => { setZuordnungen(d.zuordnungen || []); setLade(false); })
      .catch(() => setLade(false));
  }, []);

  async function toggleField(id: string, field: 'onlineErlaubt' | 'aktiv', value: boolean) {
    setMelding('');
    try {
      const res = await fetch('/api/zuordnungen', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zuordnungId: id, [field]: value }),
      });
      const data = await res.json();
      if (res.ok) {
        setZuordnungen(zuordnungen.map(z => z.id === id ? { ...z, [field]: value } : z));
        setMelding('Gespeichert.');
      } else {
        setMelding(data.error || 'Fehler.');
      }
    } catch {
      setMelding('Verbindungsfehler.');
    }
  }

  return (
    <div className='page'>
      <section className='intro'>
        <p className='eyebrow'>Smart-Apps-Demo</p>
        <h1>Termintyp-Arzt-Zuordnung</h1>
        <p><a href='/praxis'>&larr; Zurueck zum Praxis-Bereich</a></p>
      </section>

      <section className='panel'>
        {lade ? <p>Lade...</p> : (
          <table className='termin-tabelle'>
            <thead>
              <tr>
                <th>Arzt</th>
                <th>Termintyp</th>
                <th>Dauer</th>
                <th>Online erlaubt</th>
                <th>Aktiv</th>
              </tr>
            </thead>
            <tbody>
              {zuordnungen.map(z => (
                <tr key={z.id}>
                  <td>{z.arzt.name}</td>
                  <td>{z.terminTyp.bezeichnung}</td>
                  <td>{z.terminTyp.dauerStandardMinuten} min</td>
                  <td>
                    <input type='checkbox' checked={z.onlineErlaubt} onChange={e => toggleField(z.id, 'onlineErlaubt', e.target.checked)} />
                  </td>
                  <td>
                    <input type='checkbox' checked={z.aktiv} onChange={e => toggleField(z.id, 'aktiv', e.target.checked)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {melding && <p style={{ marginTop: 8, fontWeight: 'bold', color: melding === 'Gespeichert.' ? 'green' : 'red' }}>{melding}</p>}
      </section>
    </div>
  );
}