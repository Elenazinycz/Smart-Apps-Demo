import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import LogoutButton from './LogoutButton';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <div className='page'>
      <section className='intro'>
        <p className='eyebrow'>Smart-Apps-Demo</p>
        <h1>Dashboard</h1>
        <p>Angemeldet als <strong>{session.name}</strong></p>
      </section>

      <section className='panel' style={{ marginBottom: 24 }}>
        <h2>Session-Info</h2>
        <ul>
          <li><strong>Typ:</strong> {session.type === 'patient' ? 'Patient:in' : 'Praxis'}</li>
          <li><strong>Name:</strong> {session.name}</li>
          {session.rolle && <li><strong>Rolle:</strong> {session.rolle}</li>}
          {session.berechtigung && <li><strong>Berechtigung:</strong> {session.berechtigung}</li>}
          {session.benutzername && <li><strong>Benutzername:</strong> {session.benutzername}</li>}
        </ul>
      </section>

      <section className='panel' style={{ marginBottom: 24 }}>
        <h2>Navigation</h2>
        <ul>
          <li><a href='/'>Startseite</a></li>
          <li><a href='/dashboard'>Dashboard</a></li>
          {session.type === 'patient' && <li><a href='/termine'>Meine Termine</a></li>}
        </ul>
      </section>

      <LogoutButton />
    </div>
  );
}