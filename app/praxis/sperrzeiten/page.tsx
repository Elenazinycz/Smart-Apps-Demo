'use client';

import { useState, useEffect } from 'react';

type SperrzeitItem = {
  id: string;
  titel: string;
  startdatum: string;
  enddatum: string;
  startzeit: string | null;
  endzeit: string | null;
  betrifft: string;
  grund: string;
  arzt: { name: string } | null;
  erstelltVon: { name: string; rolle: string };
};

type ArztOption = { id: string; name: string };

const GRUENDE = ['Urlaub', 'Krankheit', 'Fortbildung', 'Feiertag', 'Brueckentag', 'Mittagspause'];

function fmtD(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE');
}
function fmtT(iso: string | null) {
  if (!iso) return 'ganzt?gig';
  return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

export default function SperrzeitenPage() {
  const [sperrzeiten, setSperrzeiten] = useState<SperrzeitItem[]>([]);
  const [aerzte, setAerzte] = useState<ArztOption[]>([]);
  const [lade, setLade] = useState(true);
  const [melding, setMelding] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Form
  const [titel, setTitel] = useState('');
  const [startdatum, setStartdatum] = useState('');
  const [enddatum, setEnddatum] = useState('');
  const [startzeit, setStartzeit] = useState('');
  const [endzeit, setEndzeit] = useState('');
  const [betrifft, setBetrifft] = useState('Praxis');
  const [arztId, setArztId] = useState('');
  const [grund, setGrund] = useState('Urlaub');

  function load() {
    fetch('/api/sperrzeiten').then(r => r.json()).then(d => { setSperrzeiten(d.sperrzeiten || []); setLade(false); });
    fetch('/api/aerzte').then(r => r.json()).then(d => setAerzte(d.aerzte || []));
  }

  useEffect(load, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMelding('');
    // CSRF-Token holen
    let csrfToken = "";
    try {
      const csrfRes = await fetch("/api/csrf");
      const csrfData = await csrfRes.json();
      csrfToken = csrfData.token;
    } catch {}
    try {
      const body: any = { titel, startdatum, enddatum, betrifft, grund };
      if (betrifft === 'Arzt') body.arztId = arztId;
      if (startzeit) body.startzeit = startzeit;
      if (endzeit) body.endzeit = endzeit;

      const res = await fetch('/api/sperrzeiten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) { setMelding('Sperrzeit angelegt.'); setShowForm(false); load(); }
      else { setMelding(data.error || 'Fehler.'); }
    } catch { setMelding('Verbindungsfehler.'); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Sperrzeit loeschen?')) return;
    try {
    // CSRF-Token holen
    let csrfToken = "";
    try {
      const csrfRes = await fetch("/api/csrf");
      const csrfData = await csrfRes.json();
      csrfToken = csrfData.token;
    } catch {}
      await fetch('/api/sperrzeiten?id=' + id, { method: 'DELETE', headers: { 'x-csrf-token': csrfToken } });
      load();
    } catch { setMelding('Fehler.'); }
  }

  return (
    <div className='page'>
      <section className='intro'>
        <p className='eyebrow'>Praxis Demir &amp; Kollegen</p>
        <h1>Sperrzeiten verwalten</h1>
        <p><a href='/praxis'>&larr; Zurueck</a></p>
      </section>

      <section className='panel' style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Alle Sperrzeiten</h2>
          <button className='btn-secondary' onClick={() => setShowForm(!showForm)}>{showForm ? 'Abbrechen' : 'Neu'}</button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} style={{ marginBottom: 16, padding: 16, background: '#fef3c7', borderRadius: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <label>Titel <input type='text' value={titel} onChange={e => setTitel(e.target.value)} required style={{ width: '100%' }} /></label>
              <label>Grund <select value={grund} onChange={e => setGrund(e.target.value)} style={{ width: '100%' }}>{GRUENDE.map(g => <option key={g} value={g}>{g}</option>)}</select></label>
              <label>Start <input type='date' value={startdatum} onChange={e => setStartdatum(e.target.value)} required style={{ width: '100%' }} /></label>
              <label>Ende <input type='date' value={enddatum} onChange={e => setEnddatum(e.target.value)} required style={{ width: '100%' }} /></label>
              <label>Betrifft <select value={betrifft} onChange={e => setBetrifft(e.target.value)} style={{ width: '100%' }}><option value='Praxis'>Praxis</option><option value='Arzt'>Arzt</option></select></label>
              {betrifft === 'Arzt' && <label>Arzt <select value={arztId} onChange={e => setArztId(e.target.value)} style={{ width: '100%' }} required><option value=''>Bitte waehlen</option>{aerzte.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>}
              <label>Uhrzeit von <input type='time' value={startzeit} onChange={e => setStartzeit(e.target.value)} style={{ width: '100%' }} /></label>
              <label>Uhrzeit bis <input type='time' value={endzeit} onChange={e => setEndzeit(e.target.value)} style={{ width: '100%' }} /></label>
            </div>
            <button type='submit' style={{ padding: '8px 20px', background: '#0f766e', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Sperrzeit anlegen</button>
          </form>
        )}

        {lade ? <p>Lade...</p> : (
          <table className='termin-tabelle'>
            <thead>
              <tr><th>Titel</th><th>Zeitraum</th><th>Betrifft</th><th>Grund</th><th>Erstellt von</th><th>Aktionen</th></tr>
            </thead>
            <tbody>
              {sperrzeiten.map(sz => (
                <tr key={sz.id}>
                  <td>{sz.titel}</td>
                  <td>{fmtD(sz.startdatum)} ? {fmtD(sz.enddatum)}<br/>{fmtT(sz.startzeit)} ? {fmtT(sz.endzeit)}</td>
                  <td>{sz.betrifft}{sz.arzt ? ' (' + sz.arzt.name + ')' : ''}</td>
                  <td>{sz.grund}</td>
                  <td>{sz.erstelltVon.name} ({sz.erstelltVon.rolle})</td>
                  <td><button className='btn-secondary' onClick={() => handleDelete(sz.id)}>Loeschen</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {melding && <p style={{ color: melding.includes('angelegt') ? 'green' : 'red', marginTop: 8 }}>{melding}</p>}
      </section>
    </div>
  );
}

