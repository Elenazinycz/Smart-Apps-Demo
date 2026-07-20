'use client';

import { useState, useEffect } from 'react';

type PatientOption = { id: string; name: string; geburtsdatum: string; versicherungsart: string; internePatientennummer: string };

export default function KontenAnlegenPage() {
  const [patienten, setPatienten] = useState<PatientOption[]>([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [benutzername, setBenutzername] = useState('');
  const [melding, setMelding] = useState('');
  const [lade, setLade] = useState(true);

  useEffect(() => {
    fetch('/api/patienten-konten')
      .then(r => r.json())
      .then(d => { setPatienten(d.patienten || []); setLade(false); })
      .catch(() => setLade(false));
  }, []);

  async function handleAnlegen(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPatient || !benutzername) { setMelding('Bitte Patient und Benutzername waehlen.'); return; }
    setMelding('');
    // CSRF-Token holen
    let csrfToken = "";
    try {
      const csrfRes = await fetch("/api/csrf");
      const csrfData = await csrfRes.json();
      csrfToken = csrfData.token;
    } catch {}
    try {
      const res = await fetch('/api/patienten-konten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        body: JSON.stringify({ patientId: selectedPatient, benutzername }),
      });
      const data = await res.json();
      if (res.ok) {
        setMelding('Konto erfolgreich angelegt!');
        setBenutzername('');
        setSelectedPatient('');
        setPatienten(patienten.filter(p => p.id !== selectedPatient));
      } else {
        setMelding(data.error || 'Fehler beim Anlegen.');
      }
    } catch {
      setMelding('Verbindungsfehler.');
    }
  }

  function vorschlag(name: string) {
    return name.toLowerCase().replace(/[\s.]+/g, '.').replace(/[^a-z0-9.]/g, '');
  }

  function handlePatientSelect(id: string) {
    setSelectedPatient(id);
    const p = patienten.find(pp => pp.id === id);
    if (p) setBenutzername(vorschlag(p.name));
  }

  return (
    <div className='page'>
      <section className='intro'>
        <p className='eyebrow'>Praxis Demir &amp; Kollegen</p>
        <h1>Neues PatientenKonto anlegen</h1>
        <p><a href='/praxis'>&larr; Zurueck zum Praxis-Bereich</a></p>
      </section>

      <section className='panel'>
        <form onSubmit={handleAnlegen}>
          <div style={{ marginBottom: 16 }}>
            <label>Patient (ohne Konto)<br />
              <select value={selectedPatient} onChange={e => handlePatientSelect(e.target.value)} disabled={lade} style={{ width: '100%' }}>
                <option value=''>-- Bitte waehlen --</option>
                {patienten.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.internePatientennummer}) ? {p.versicherungsart}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label>Benutzername<br />
              <input type='text' value={benutzername} onChange={e => setBenutzername(e.target.value)} style={{ width: '100%' }} required />
            </label>
          </div>
          {melding && <p style={{ fontWeight: 'bold', color: melding.includes('erfolgreich') ? 'green' : 'red', marginBottom: 12 }}>{melding}</p>}
          <button type='submit' disabled={!selectedPatient || !benutzername}
            style={{ padding: '10px 24px', background: '#0f766e', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '1rem' }}>
            Konto anlegen
          </button>
        </form>
      </section>
    </div>
  );
}

