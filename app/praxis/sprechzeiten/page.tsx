'use client';

import { useState, useEffect } from 'react';

type Sprechzeit = {
  id: string;
  wochentag: number;
  startZeit: string;
  endZeit: string;
  aktiv: boolean;
  arzt: { name: string };
};

type ArztOption = { id: string; name: string };

const WOCHENTAGE = ['', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

export default function SprechzeitenPage() {
  const [sprechzeiten, setSprechzeiten] = useState<Sprechzeit[]>([]);
  const [aerzte, setAerzte] = useState<ArztOption[]>([]);
  const [lade, setLade] = useState(true);
  const [melding, setMelding] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Form
  const [arztId, setArztId] = useState('');
  const [wochentag, setWochentag] = useState(1);
  const [startZeit, setStartZeit] = useState('08:00');
  const [endZeit, setEndZeit] = useState('12:00');

  function load() {
    fetch('/api/sprechzeiten').then(r => r.json()).then(d => { setSprechzeiten(d.sprechzeiten || []); setLade(false); });
    fetch('/api/aerzte').then(r => r.json()).then(d => setAerzte(d.aerzte || []));
  }

  useEffect(load, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMelding('');
    try {
      const res = await fetch('/api/sprechzeiten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ arztId, wochentag, startZeit, endZeit }),
      });
      const data = await res.json();
      if (res.ok) { setMelding('Sprechzeit angelegt.'); setShowForm(false); load(); }
      else { setMelding(data.error || 'Fehler.'); }
    } catch { setMelding('Verbindungsfehler.'); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Sprechzeit loeschen?')) return;
    try {
      await fetch('/api/sprechzeiten?id=' + id, { method: 'DELETE' });
      load();
    } catch { setMelding('Fehler.'); }
  }

  async function toggleAktiv(id: string, aktiv: boolean) {
    try {
      await fetch('/api/sprechzeiten', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, aktiv }),
      });
      load();
    } catch { setMelding('Fehler.'); }
  }

  return (
    <div className='page'>
      <section className='intro'>
        <p className='eyebrow'>Smart-Apps-Demo</p>
        <h1>Sprechzeiten verwalten</h1>
        <p><a href='/praxis'>&larr; Zurueck</a></p>
      </section>

      <section className='panel' style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Alle Sprechzeiten</h2>
          <button className='btn-secondary' onClick={() => setShowForm(!showForm)}>{showForm ? 'Abbrechen' : 'Neu'}</button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} style={{ marginBottom: 16, padding: 12, background: '#f0fdf4', borderRadius: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <select value={arztId} onChange={e => setArztId(e.target.value)} required>
                <option value=''>Arzt waehlen</option>
                {aerzte.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <select value={wochentag} onChange={e => setWochentag(Number(e.target.value))}>
                {WOCHENTAGE.slice(1).map((tag, i) => <option key={i + 1} value={i + 1}>{tag}</option>)}
              </select>
              <label>Von <input type='time' value={startZeit} onChange={e => setStartZeit(e.target.value)} required /></label>
              <label>Bis <input type='time' value={endZeit} onChange={e => setEndZeit(e.target.value)} required /></label>
            </div>
            <button type='submit' style={{ padding: '8px 20px', background: '#0f766e', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Sprechzeit anlegen</button>
          </form>
        )}

        {lade ? <p>Lade...</p> : (
          <table className='termin-tabelle'>
            <thead>
              <tr><th>Arzt</th><th>Wochentag</th><th>Von</th><th>Bis</th><th>Aktiv</th><th>Aktionen</th></tr>
            </thead>
            <tbody>
              {sprechzeiten.map(sz => (
                <tr key={sz.id}>
                  <td>{sz.arzt.name}</td>
                  <td>{WOCHENTAGE[sz.wochentag]}</td>
                  <td>{sz.startZeit}</td>
                  <td>{sz.endZeit}</td>
                  <td><input type='checkbox' checked={sz.aktiv} onChange={e => toggleAktiv(sz.id, e.target.checked)} /></td>
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