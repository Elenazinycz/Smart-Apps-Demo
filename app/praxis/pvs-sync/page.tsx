import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { istMfaOderAdmin } from '@/lib/rollen';
import SyncLogClient from './SyncLogClient';
import ManuellerImport from './ManuellerImport';

export default async function PvsSyncPage() {
  const session = await getSession();
  if (!session || session.type !== 'praxis' || !istMfaOderAdmin(session)) redirect('/login');

  return (
    <div className='page'>
      <section className='intro'>
        <p className='eyebrow'>Smart-Apps-Demo</p>
        <h1>PVS-Synchronisation</h1>
        <p>Sync-Status und Logs f&uuml;r MFA/Admin</p>
      </section>

      <section className='panel' style={{marginBottom:24}}>
        <h2>Sync-Logs</h2>
        <SyncLogClient />
      </section>

      <section className='panel'>
        <h2>Manueller Patienten-Import aus PVS</h2>
        <p style={{fontSize:'0.85rem', color:'#555'}}>
          PVS-Patientennummer eingeben, um Stammdaten aus dem PVS zu aktualisieren (Mock).
        </p>
        <ManuellerImport />
      </section>
    </div>
  );
}

