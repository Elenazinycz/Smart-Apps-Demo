'use client';

import { useState } from 'react';

export default function WiederholungsrezeptImport() {
  const [pvsNr, setPvsNr] = useState('');
  const [status, setStatus] = useState<'ausstehend' | 'abholbereit' | 'abgeholt'>('ausstehend');
  const [bemerkung, setBemerkung] = useState('');
  const [meldung, setMeldung] = useState<{ typ: 'erfolg' | 'fehler'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleImport() {
    if (!pvsNr.trim()) return;
    setLoading(true);
    setMeldung(null);

    try {
      let csrfToken = '';
      try {
        const csrfRes = await fetch('/api/csrf');
        const csrfData = await csrfRes.json();
        csrfToken = csrfData.token;
      } catch {
        /* fallback */
      }

      const res = await fetch('/api/wiederholungsrezepte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        body: JSON.stringify({
          pvsPatientenNr: pvsNr.trim(),
          rezeptStatus: status,
          bemerkung: bemerkung.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMeldung({ typ: 'erfolg', text: 'Rezept-Status erfolgreich importiert.' });
        // Liste automatisch neu laden
        window.location.reload();
      } else {
        setMeldung({ typ: 'fehler', text: data.error ?? 'Import fehlgeschlagen.' });
      }
    } catch {
      setMeldung({ typ: 'fehler', text: 'Netzwerkfehler.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel" style={{marginTop:24}}>
      <h2>Rezept-Status setzen (Mock-PVS-Import)</h2>
      <p style={{fontSize:'0.85rem', color:'#555'}}>
        PVS-Patientennummer eingeben und Rezept-Status ausw&auml;hlen.
      </p>
      <div style={{display:'flex', flexDirection:'column', gap:12, marginTop:8}}>
        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          <input
            type="text"
            value={pvsNr}
            onChange={e => setPvsNr(e.target.value)}
            placeholder="z.B. PAT-001"
            style={{padding:'6px 10px', border:'1px solid #ccc', borderRadius:4, flex:1}}
          />
          <select
            value={status}
            onChange={e => setStatus(e.target.value as typeof status)}
            style={{padding:'6px 10px', border:'1px solid #ccc', borderRadius:4}}
          >
            <option value="ausstehend">Ausstehend</option>
            <option value="abholbereit">Abholbereit</option>
            <option value="abgeholt">Abgeholt</option>
          </select>
        </div>
        <input
          type="text"
          value={bemerkung}
          onChange={e => setBemerkung(e.target.value)}
          placeholder="Bemerkung (optional)"
          style={{padding:'6px 10px', border:'1px solid #ccc', borderRadius:4}}
        />
        <div>
          <button onClick={handleImport} disabled={loading || !pvsNr.trim()} className="button">
            {loading ? 'Importiere...' : 'Import starten'}
          </button>
        </div>
      </div>
      {meldung && (
        <p style={{ color: meldung.typ === 'erfolg' ? '#2e7d32' : '#c62828', marginTop: 8 }}>
          {meldung.text}
        </p>
      )}
    </div>
  );
}
