'use client';

import { useState, useEffect } from 'react';

type RegelItem = {
  id: string;
  schluessel: string;
  wert: string;
  beschreibung: string | null;
};

const REGEL_LABELS: Record<string, string> = {
  stornierungsfristStd: 'Stornierungsfrist',
  umbuchungsfristStd: 'Umbuchungsfrist',
  erinnerungsfristStd: 'Erinnerungsfrist',
  noShowLimitErinnerung: 'No-Show-Limit (Erinnerung)',
  noShowLimitSperre: 'No-Show-Limit (Sperre)',
  akutSlotVormittag: 'Akutslots Vormittag',
  akutSlotNachmittag: 'Akutslots Nachmittag',
};

const REGEL_EINHEITEN: Record<string, string> = {
  stornierungsfristStd: 'Stunden',
  umbuchungsfristStd: 'Stunden',
  erinnerungsfristStd: 'Stunden',
  noShowLimitErinnerung: 'No-Shows/Jahr',
  noShowLimitSperre: 'No-Shows/Jahr',
  akutSlotVormittag: 'Slots',
  akutSlotNachmittag: 'Slots',
};

export default function PraxisregelnPage() {
  const [regeln, setRegeln] = useState<RegelItem[]>([]);
  const [lade, setLade] = useState(true);
  const [melding, setMelding] = useState('');
  const [editWerte, setEditWerte] = useState<Record<string, string>>({});

  function load() {
    fetch('/api/praxisregeln')
      .then(r => r.json())
      .then(d => {
        const list = d.regeln || [];
        setRegeln(list);
        const werte: Record<string, string> = {};
        list.forEach((r: RegelItem) => { werte[r.id] = r.wert; });
        setEditWerte(werte);
        setLade(false);
      })
      .catch(() => setLade(false));
  }

  useEffect(load, []);

  async function handleSave(id: string) {
    setMelding('');
    try {
      const res = await fetch('/api/praxisregeln', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, wert: editWerte[id] }),
      });
      const data = await res.json();
      if (res.ok) {
        setMelding('Gespeichert.');
        setRegeln(regeln.map(r => r.id === id ? { ...r, wert: editWerte[id] } : r));
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
        <p className='eyebrow'>Praxis Demir &amp; Kollegen</p>
        <h1>Praxisregeln verwalten</h1>
        <p><a href='/praxis'>&larr; Zurueck zum Praxis-Bereich</a></p>
        <p style={{ fontSize: '0.9rem', color: '#666' }}>
          Zentrale Konfiguration fuer Buchungsfristen, No-Show-Grenzen und Akutslots.
          Aenderungen wirken sofort auf die Buchungslogik.
        </p>
      </section>

      <section className='panel'>
        {lade ? <p>Lade...</p> : (
          <table className='termin-tabelle'>
            <thead>
              <tr><th>Regel</th><th>Beschreibung</th><th>Wert</th><th>Einheit</th><th>Aktionen</th></tr>
            </thead>
            <tbody>
              {regeln.map(r => (
                <tr key={r.id}>
                  <td><strong>{REGEL_LABELS[r.schluessel] || r.schluessel}</strong></td>
                  <td>{r.beschreibung ?? ''}</td>
                  <td>
                    <input
                      type='number'
                      value={editWerte[r.id] ?? r.wert}
                      onChange={e => setEditWerte({ ...editWerte, [r.id]: e.target.value })}
                      style={{ width: 80, textAlign: 'center' }}
                      min={0}
                    />
                  </td>
                  <td>{REGEL_EINHEITEN[r.schluessel] ?? ''}</td>
                  <td>
                    <button className='btn-secondary' onClick={() => handleSave(r.id)}>Speichern</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {melding && <p style={{ color: melding === 'Gespeichert.' ? 'green' : 'red', marginTop: 8 }}>{melding}</p>}
      </section>
    </div>
  );
}

