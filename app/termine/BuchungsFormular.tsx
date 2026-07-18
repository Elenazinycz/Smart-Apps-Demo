'use client';

import { useState, useEffect } from 'react';

type TermintypOption = { id: string; bezeichnung: string; dauer: number };
type ArztOption = { id: string; name: string };
type SlotOption = { slotID: string; startzeit: string; endzeit: string };

export default function BuchungsFormular() {
  const [termintypen, setTermintypen] = useState<TermintypOption[]>([]);
  const [aerzte, setAerzte] = useState<ArztOption[]>([]);
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [selectedTyp, setSelectedTyp] = useState('');
  const [selectedArzt, setSelectedArzt] = useState('');
  const [selectedDatum, setSelectedDatum] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [melding, setMelding] = useState('');
  const [ladeSlots, setLadeSlots] = useState(false);

  useEffect(() => { fetch('/api/termintypen').then(r => r.json()).then(d => setTermintypen(d.termintypen)); }, []);

  useEffect(() => { if (!selectedTyp) { setAerzte([]); return; } fetch('/api/aerzte?terminTypId=' + selectedTyp).then(r => r.json()).then(d => setAerzte(d.aerzte)); }, [selectedTyp]);

  useEffect(() => {
    if (!selectedArzt || !selectedTyp || !selectedDatum) { setSlots([]); return; }
    setLadeSlots(true);
    fetch('/api/slots?arztId=' + selectedArzt + '&terminTypId=' + selectedTyp + '&datum=' + selectedDatum)
      .then(r => r.json()).then(d => { setSlots(d.slots || []); setLadeSlots(false); }).catch(() => setLadeSlots(false));
  }, [selectedArzt, selectedTyp, selectedDatum]);

  async function handleBuchen() {
    if (!selectedSlot) { setMelding('Bitte wählen Sie einen freien Slot.'); return; }
    setMelding('');
    // CSRF-Token holen
    let csrfTokenBuch = "";
    try {
      const csrfRes = await fetch("/api/csrf");
      const csrfData = await csrfRes.json();
      csrfTokenBuch = csrfData.token;
    } catch {}
    try {
      const res = await fetch('/api/appointments', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfTokenBuch }, body: JSON.stringify({ terminTypId: selectedTyp, arztId: selectedArzt, datum: selectedDatum, startzeit: selectedSlot }) });
      const data = await res.json();
      if (res.ok) { setMelding('Termin erfolgreich gebucht!'); setSelectedSlot(''); setSlots([]); }
      else { setMelding(data.error || 'Fehler bei der Buchung.'); }
    } catch { setMelding('Verbindungsfehler.'); }
  }

  function fmtZeit(iso: string) { return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }); }

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <label>Termintyp<br />
          <select value={selectedTyp} onChange={e => { setSelectedTyp(e.target.value); setSelectedArzt(''); setSelectedSlot(''); }}>
            <option value=''>-- Bitte wählen --</option>
            {termintypen.map(t => <option key={t.id} value={t.id}>{t.bezeichnung} ({t.dauer} min)</option>)}
          </select>
        </label>
      </div>
      {selectedTyp && (
        <div style={{ marginBottom: 12 }}>
          <label>Arzt<br />
            <select value={selectedArzt} onChange={e => { setSelectedArzt(e.target.value); setSelectedSlot(''); }}>
              <option value=''>-- Bitte wählen --</option>
              {aerzte.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </label>
        </div>
      )}
      {selectedArzt && (
        <div style={{ marginBottom: 12 }}>
          <label>Datum<br />
            <input type='date' value={selectedDatum} onChange={e => { setSelectedDatum(e.target.value); setSelectedSlot(''); }} />
          </label>
        </div>
      )}
      {ladeSlots && <p>Lade verfügbare Slots...</p>}
      {slots.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <label>Freie Slots<br />
            <select value={selectedSlot} onChange={e => setSelectedSlot(e.target.value)} size={Math.min(slots.length, 6)} style={{ width: '100%' }}>
              {slots.map(s => <option key={s.slotID} value={fmtZeit(s.startzeit)}>{fmtZeit(s.startzeit)} - {fmtZeit(s.endzeit)}</option>)}
            </select>
          </label>
        </div>
      )}
      {slots.length === 0 && selectedDatum && !ladeSlots && <p>Keine freien Slots an diesem Tag.</p>}
      {selectedSlot && (
        <button onClick={handleBuchen} style={{ padding: '8px 24px', background: '#005a9c', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          Verbindlich buchen
        </button>
      )}
      {melding && <p style={{ marginTop: 12, fontWeight: 'bold', color: melding.includes('erfolgreich') ? 'green' : 'red' }}>{melding}</p>}
    </div>
  );
}
