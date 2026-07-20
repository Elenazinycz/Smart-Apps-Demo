'use client';

import { useEffect, useState } from 'react';

interface SyncLogEntry {
  id: string;
  ereignis: string;
  referenzTyp: string | null;
  referenzId: string | null;
  status: string;
  fehlerMeldung: string | null;
  versuch: number;
  erstelltAm: string;
}

export default function SyncLogClient() {
  const [logs, setLogs] = useState<SyncLogEntry[]>([]);
  const [offeneSyncs, setOffeneSyncs] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/pvs-sync')
      .then(r => r.json())
      .then(data => {
        setLogs(data.logs ?? []);
        setOffeneSyncs(data.offeneSyncs ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Lade Sync-Logs...</p>;

  return (
    <div>
      <p style={{marginBottom:12}}>
        <strong>Offene Sync-Fehler:</strong> {offeneSyncs}
        {offeneSyncs > 0 && <span style={{color:'#c62828', marginLeft:8}}>Bitte prüfen!</span>}
      </p>

      {logs.length === 0 ? (
        <p>Keine Sync-Einträge vorhanden.</p>
      ) : (
        <table className='patient-daten' style={{width:'100%'}}>
          <thead>
            <tr>
              <th>Zeit</th>
              <th>Ereignis</th>
              <th>Status</th>
              <th>Referenz</th>
              <th>Fehler</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id} style={{background: log.status === 'fehler' ? '#fff0f0' : undefined}}>
                <td>{new Date(log.erstelltAm).toLocaleString('de-DE')}</td>
                <td>{log.ereignis}</td>
                <td>{log.status === 'erfolg' ? '? Erfolg' : '? Fehler'}</td>
                <td style={{fontSize:'0.85rem'}}>{log.referenzTyp ?? '—'}: {log.referenzId?.substring(0,8) ?? '—'}</td>
                <td style={{color:'#c62828', fontSize:'0.85rem'}}>{log.fehlerMeldung ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

