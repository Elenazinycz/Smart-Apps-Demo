'use client';

import { useState } from 'react';

export default function ManuellerImport() {
  const [pvsNr, setPvsNr] = useState('');
  const [meldung, setMeldung] = useState<{ typ: 'erfolg' | 'fehler'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleImport() {
    if (!pvsNr.trim()) return;
    setLoading(true);
    setMeldung(null);

    try {
      const res = await fetch('/api/pvs-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': document.cookie.replace(/.*csrf-token=([^;]*).*/, '') },
        body: JSON.stringify({ pvsPatientenNr: pvsNr.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setMeldung({ typ: 'erfolg', text: 'Import erfolgreich.' });
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
    <div>
      <div style={{display:'flex', gap:8, alignItems:'center', marginTop:8}}>
        <input
          type="text"
          value={pvsNr}
          onChange={e => setPvsNr(e.target.value)}
          placeholder="z.B. PAT-001"
          style={{padding:'6px 10px', border:'1px solid #ccc', borderRadius:4}}
        />
        <button onClick={handleImport} disabled={loading || !pvsNr.trim()} className="button">
          {loading ? 'Importiere...' : 'Import starten'}
        </button>
      </div>
      {meldung && (
        <p style={{ color: meldung.typ === 'erfolg' ? '#2e7d32' : '#c62828', marginTop: 8 }}>
          {meldung.text}
        </p>
      )}
    </div>
  );
}
