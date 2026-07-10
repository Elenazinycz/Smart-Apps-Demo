import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { istAdmin, istMfa, istMfaOderAdmin, istArzt } from '@/lib/rollen';
import Link from 'next/link';

export default async function PraxisPage() {
  const session = await getSession();
  if (!session || session.type !== 'praxis') redirect('/login');

  return (
    <div className='page'>
      <section className='intro'>
        <p className='eyebrow'>Smart-Apps-Demo</p>
        <h1>Praxis-Bereich</h1>
        <p>Angemeldet als <strong>{session.name}</strong> — Rolle: {session.rolle}</p>
      </section>

      {istMfaOderAdmin(session) && (
        <section className='panel' style={{ marginBottom: 24 }}>
          <h2>PatientenKonten</h2>
          <ul>
            <li><a href='/praxis/konten-anlegen'>Neues PatientenKonto anlegen</a></li>
          </ul>
        </section>
      )}

      {istAdmin(session) && (
        <section className='panel' style={{ marginBottom: 24 }}>
          <h2>Verwaltung</h2>
          <ul>
            <li><a href='/praxis/termintyp-zuordnung'>Termintyp-Arzt-Zuordnung verwalten</a></li>
          </ul>
        </section>
      )}

      <section className='panel' style={{ marginBottom: 24 }}>
        <h2>Navigation</h2>
        <ul>
          <li><a href='/dashboard'>Dashboard</a></li>
          <li><a href='/'>Startseite</a></li>
        </ul>
      </section>
    </div>
  );
}