'use client';

import { useState, useEffect } from 'react';

type TermintypItem = {
  id: string;
  bezeichnung: string;
  dauerStandardMinuten: number;
  onlineBuchbar: boolean;
  beschreibung: string | null;
  prioritaet: string;
  arztZuordnungen: { id: string; arztId: string; aktiv: boolean }[];
};

const PRIO_OPTIONEN = ['niedrig', 'normal', 'hoch'];

export default function TermintypenPage() {
  const [termintypen, setTermintypen] = useState<TermintypItem[]>([]);
  const [lade, setLade] = useState(true);
  const [melding, setMelding] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form
  const [bezeichnung, setBezeichnung] = useState('');
  const [dauer, setDauer] = useState(15);
  const [onlineBuchbar, setOnlineBuchbar] = useState(false);
  const [beschreibung, setBeschreibung] = useState('');
  const [prioritaet, setPrioritaet] = useState('normal');

  function load() {
    fetch('/api/termintypen/admin')
      .then(r => r.json())
      .then(d => { setTermintypen(d.termintypen || []); setLade(false); });
  }

  useEffect(load, []);

  function resetForm() {
    setBezeichnung('');
    setDauer(15);
    setOnlineBuchbar(false);
    setBeschreibung('');
    setPrioritaet('normal');
    setEditId(null);
  }

  function fillForm(tt: TermintypItem) {
    setBezeichnung(tt.bezeichnung);
    setDauer(tt.dauerStandardMinuten);
    setOnlineBuchbar(tt.onlineBuchbar);
    setBeschreibung(tt.beschreibung ?? '');
    setPrioritaet(tt.prioritaet);
    setEditId(tt.id);
  }

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
    const method = editId ? 'PUT' : 'POST';
    const body = editId
      ? { id: editId, bezeichnung, dauerStandardMinuten: dauer, onlineBuchbar, beschreibung: beschreibung || null, prioritaet }
      : { bezeichnung, dauerStandardMinuten: dauer, onlineBuchbar, beschreibung: beschreibung || null, prioritaet };

    try {
      const res = await fetch('/api/termintypen/admin', {
        method,
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setMelding(editId ? 'Termintyp aktualisiert.' : 'Termintyp angelegt.');
        setShowForm(false);
        resetForm();
        load();
      } else {
        setMelding(data.error || 'Fehler.');
      }
    } catch {
      setMelding('Verbindungsfehler.');
    }
  }

  async function handleDelete(id: string, bezeichnung: string) {
    if (!confirm('Termintyp "' + bezeichnung + '" wirklich loeschen?')) return;
    try {
    // CSRF-Token holen
    let csrfToken = "";
    try {
      const csrfRes = await fetch("/api/csrf");
      const csrfData = await csrfRes.json();
      csrfToken = csrfData.token;
    } catch {}
      const res = await fetch('/api/termintypen/admin?id=' + id, { method: 'DELETE', headers: { 'x-csrf-token': csrfToken } });
      const data = await res.json();
      if (res.ok) {
        setMelding('Termintyp geloescht.');
        load();
      } else {
        setMelding(data.error || 'Fehler.');
      }
    } catch {
      setMelding('Fehler.');
    }
  }

  return (
    <div className='page'>
      <section className='intro'>
        <p className='eyebrow'>Smart-Apps-Demo</p>
        <h1>Termintypen verwalten</h1>
        <p><a href='/praxis'>&larr; Zurueck zum Praxis-Bereich</a></p>
      </section>

      <section className='panel' style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Alle Termintypen</h2>
          <button className='btn-secondary' onClick={() => { setShowForm(!showForm); resetForm(); }}>
            {showForm ? 'Abbrechen' : 'Neu'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} style={{ marginBottom: 16, padding: 16, background: '#f0fdf4', borderRadius: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <label>Bezeichnung <input type='text' value={bezeichnung} onChange={e => setBezeichnung(e.target.value)} required style={{ width: '100%' }} /></label>
              <label>Dauer (Min.) <input type='number' value={dauer} onChange={e => setDauer(Number(e.target.value))} min={1} required style={{ width: '100%' }} /></label>
              <label>Online buchbar <input type='checkbox' checked={onlineBuchbar} onChange={e => setOnlineBuchbar(e.target.checked)} style={{ marginLeft: 8 }} /></label>
              <label>Prioritaet <select value={prioritaet} onChange={e => setPrioritaet(e.target.value)} style={{ width: '100%' }}>{PRIO_OPTIONEN.map(p => <option key={p} value={p}>{p}</option>)}</select></label>
              <label style={{ gridColumn: 'span 2' }}>
                Beschreibung <input type='text' value={beschreibung} onChange={e => setBeschreibung(e.target.value)} style={{ width: '100%' }} />
              </label>
            </div>
            <button type='submit' style={{ padding: '8px 20px', background: '#0f766e', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
              {editId ? 'Aktualisieren' : 'Anlegen'}
            </button>
          </form>
        )}

        {lade ? <p>Lade...</p> : (
          <table className='termin-tabelle'>
            <thead>
              <tr><th>Bezeichnung</th><th>Dauer</th><th>Online</th><th>Prioritaet</th><th>Beschreibung</th><th>Zuordnungen</th><th>Aktionen</th></tr>
            </thead>
            <tbody>
              {termintypen.map(tt => (
                <tr key={tt.id}>
                  <td><strong>{tt.bezeichnung}</strong></td>
                  <td>{tt.dauerStandardMinuten} min</td>
                  <td>{tt.onlineBuchbar ? 'Ja' : 'Nein'}</td>
                  <td>{tt.prioritaet}</td>
                  <td>{tt.beschreibung ?? '-'}</td>
                  <td>{tt.arztZuordnungen.filter(z => z.aktiv).length} aktiv</td>
                  <td>
                    <button className='btn-secondary' style={{ marginRight: 4 }} onClick={() => { fillForm(tt); setShowForm(true); }}>Bearbeiten</button>
                    <button className='btn-secondary' onClick={() => handleDelete(tt.id, tt.bezeichnung)}>Loeschen</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {melding && <p style={{ color: melding.includes('geloescht') || melding.includes('Fehler') ? 'red' : 'green', marginTop: 8 }}>{melding}</p>}
      </section>
    </div>
  );
}