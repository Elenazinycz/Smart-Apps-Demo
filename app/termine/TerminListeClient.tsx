'use client';

import { useState } from 'react';

type TermintypOption = { id: string; bezeichnung: string; dauer: number };
type ArztOption = { id: string; name: string };
type SlotOption = { slotID: string; startzeit: string; endzeit: string };

type TerminItem = {
  id: string;
  datum: Date;
  startzeit: Date;
  endzeit: Date;
  arzt: { name: string };
  terminTyp: { bezeichnung: string; dauerStandardMinuten: number };
};

function fmtDate(d: Date) {
  return d.toLocaleDateString('de-DE');
}
function fmtTime(d: Date) {
  return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}
function fmtZeit(iso: string) {
  return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

function UmbuchungsForm({ terminId, onAbbrechen, onErfolg }: {
  terminId: string;
  onAbbrechen: () => void;
  onErfolg: () => void;
}) {
  const [termintypen, setTermintypen] = useState<TermintypOption[]>([]);
  const [aerzte, setAerzte] = useState<ArztOption[]>([]);
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [selectedTyp, setSelectedTyp] = useState('');
  const [selectedArzt, setSelectedArzt] = useState('');
  const [selectedDatum, setSelectedDatum] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [melding, setMelding] = useState('');
  const [ladeSlots, setLadeSlots] = useState(false);

  // Load termintypen on mount
  useState(() => {
    fetch('/api/termintypen').then(r => r.json()).then(d => setTermintypen(d.termintypen));
  });

  function ladeAerzte(typId: string) {
    setSelectedTyp(typId);
    setSelectedArzt('');
    setSelectedSlot('');
    setSlots([]);
    if (!typId) { setAerzte([]); return; }
    fetch('/api/aerzte?terminTypId=' + typId).then(r => r.json()).then(d => setAerzte(d.aerzte));
  }

  function ladeSlotsFuer(arztId: string, datum: string) {
    if (!selectedTyp || !arztId || !datum) { setSlots([]); return; }
    setLadeSlots(true);
    fetch('/api/slots?arztId=' + arztId + '&terminTypId=' + selectedTyp + '&datum=' + datum)
      .then(r => r.json()).then(d => { setSlots(d.slots || []); setLadeSlots(false); }).catch(() => setLadeSlots(false));
  }

  async function handleUmbuchen() {
    if (!selectedSlot) { setMelding('Bitte waehlen Sie einen freien Slot.'); return; }
    setMelding('');
    // CSRF-Token holen
    let csrfToken = "";
    try {
      const csrfRes = await fetch("/api/csrf");
      const csrfData = await csrfRes.json();
      const csrfToken = csrfData.token;
    } catch {}
    try {
      const res = await fetch('/api/appointments/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        body: JSON.stringify({
          slotId: terminId,
          terminTypId: selectedTyp,
          arztId: selectedArzt,
          datum: selectedDatum,
          startzeit: selectedSlot,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMelding('Termin erfolgreich umgebucht!');
        setTimeout(onErfolg, 1500);
      } else {
        setMelding(data.error || 'Fehler bei der Umbuchung.');
      }
    } catch {
      setMelding('Verbindungsfehler.');
    }
  }

  return (
    <div className="panel" style={{ marginTop: 16, background: '#f0fdf4' }}>
      <h4 style={{ margin: '0 0 12px' }}>Termin umbuchen</h4>
      <div style={{ marginBottom: 8 }}>
        <label>Neuer Termintyp<br />
          <select value={selectedTyp} onChange={e => ladeAerzte(e.target.value)}>
            <option value=''>-- Bitte waehlen --</option>
            {termintypen.map(t => <option key={t.id} value={t.id}>{t.bezeichnung} ({t.dauer} min)</option>)}
          </select>
        </label>
      </div>
      {selectedTyp && (
        <div style={{ marginBottom: 8 }}>
          <label>Arzt<br />
            <select value={selectedArzt} onChange={e => { setSelectedArzt(e.target.value); setSelectedSlot(''); }}>
              <option value=''>-- Bitte waehlen --</option>
              {aerzte.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </label>
        </div>
      )}
      {selectedArzt && (
        <div style={{ marginBottom: 8 }}>
          <label>Neues Datum<br />
            <input type='date' value={selectedDatum} onChange={e => { setSelectedDatum(e.target.value); setSelectedSlot(''); ladeSlotsFuer(selectedArzt, e.target.value); }} />
          </label>
        </div>
      )}
      {ladeSlots && <p>Lade verfuegbare Slots...</p>}
      {slots.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <label>Freie Slots<br />
            <select value={selectedSlot} onChange={e => setSelectedSlot(e.target.value)} size={Math.min(slots.length, 4)} style={{ width: '100%' }}>
              {slots.map(s => <option key={s.slotID} value={s.startzeit}>{fmtZeit(s.startzeit)} - {fmtZeit(s.endzeit)}</option>)}
            </select>
          </label>
        </div>
      )}
      {slots.length === 0 && selectedDatum && !ladeSlots && <p>Keine freien Slots an diesem Tag.</p>}
      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <button onClick={handleUmbuchen} disabled={!selectedSlot}
          style={{ padding: '8px 24px', background: '#0f766e', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          Umbuchung bestaetigen
        </button>
        <button onClick={onAbbrechen}
          style={{ padding: '8px 24px', background: '#6b7280', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          Abbrechen
        </button>
      </div>
      {melding && (
        <p style={{ marginTop: 8, fontWeight: 'bold', color: melding.includes('erfolgreich') ? 'green' : 'red' }}>{melding}</p>
      )}
    </div>
  );
}

export default function TerminListeClient({ termine }: { termine: TerminItem[] }) {
  const [umbuchungsId, setUmbuchungsId] = useState<string | null>(null);
  const [melding, setMelding] = useState<{ text: string; typ: 'erfolg' | 'fehler' } | null>(null);

  async function handleStornieren(slotId: string) {
    if (!confirm('Moechten Sie diesen Termin wirklich stornieren?')) return;
    setMelding(null);
    // CSRF-Token holen
    let csrfToken = "";
    try {
      const csrfRes = await fetch("/api/csrf");
      const csrfData = await csrfRes.json();
      csrfToken = csrfData.token;
    } catch {}
    try {
      const res = await fetch('/api/appointments/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        body: JSON.stringify({ slotId }),
      });
      const data = await res.json();
      if (res.ok) {
        setMelding({ text: 'Termin erfolgreich storniert.', typ: 'erfolg' });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setMelding({ text: data.error || 'Fehler bei der Stornierung.', typ: 'fehler' });
      }
    } catch {
      setMelding({ text: 'Verbindungsfehler.', typ: 'fehler' });
    }
  }

  function handleUmbuchenClick(id: string) {
    setUmbuchungsId(umbuchungsId === id ? null : id);
    setMelding(null);
  }

  const jetzt = new Date();

  return (
    <div>
      <table className="termin-tabelle">
        <thead>
          <tr>
            <th>Datum/Zeit</th>
            <th>Arzt</th>
            <th>Typ</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {termine.map(t => {
            const frist = new Date(new Date(t.startzeit).getTime() - 24 * 60 * 60 * 1000);
            const kannStornieren = jetzt < frist;
            return (
              <tr key={t.id}>
                <td>{fmtDate(new Date(t.datum))} {fmtTime(new Date(t.startzeit))}</td>
                <td>{t.arzt.name}</td>
                <td>{t.terminTyp.bezeichnung} ({t.terminTyp.dauerStandardMinuten} min)</td>
                <td>
                  {kannStornieren ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-secondary" onClick={() => handleStornieren(t.id)}>Stornieren</button>
                      <button className="btn-secondary" onClick={() => handleUmbuchenClick(t.id)}>Umbuchen</button>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                      {jetzt > new Date(t.startzeit) ? 'Bereits vergangen' : 'Stornierungsfrist abgelaufen'}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {umbuchungsId && (
        <UmbuchungsForm
          terminId={umbuchungsId}
          onAbbrechen={() => setUmbuchungsId(null)}
          onErfolg={() => window.location.reload()}
        />
      )}

      {melding && (
        <p style={{ marginTop: 12, fontWeight: 'bold', color: melding.typ === 'erfolg' ? 'green' : 'red' }}>
          {melding.text}
        </p>
      )}
    </div>
  );
}

