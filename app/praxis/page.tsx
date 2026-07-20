import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { istAdmin, istMfaOderAdmin, istArzt } from '@/lib/rollen';

export default async function PraxisPage() {
  const session = await getSession();
  if (!session || session.type !== 'praxis') redirect('/login');

  return (
    <div className='page'>
      <section className='intro'>
        <p className='eyebrow'>Praxis Demir &amp; Kollegen</p>
        <h1>Praxis-Bereich</h1>
        <p>Angemeldet als <strong>{session.name}</strong> — Rolle: {session.rolle}</p>
      </section>

      {istMfaOderAdmin(session) && (
        <>
          <section className='panel' style={{ marginBottom: 24 }}>
            <h2>Übersichten (Tagesliste &amp; Live)</h2>
            <ul>
              <li><a href='/praxis/tagesliste'>Tagesliste anzeigen (alle Termine)</a></li>
              <li><a href='/praxis/akutslots-live'>Freie Akutslots (Live)</a></li>
              <li><a href='/praxis/gesperrte-patienten'>Gesperrte Patient:innen</a></li>
              <li><a href='/praxis/wiederholungsrezepte'>Wiederholungsrezepte (Übersicht)</a></li>
            </ul>
          </section>
          <section className='panel' style={{ marginBottom: 24 }}>
            <h2>PatientenKonten</h2>
            <ul>
              <li><a href='/praxis/konten-anlegen'>Neues PatientenKonto anlegen</a></li>
            </ul>
          </section>
          <section className='panel' style={{ marginBottom: 24 }}>
            <h2>Akutslots</h2>
            <ul>
              <li><a href='/praxis/akutslots'>Akutslots verwalten &amp; freigeben</a></li>
            </ul>
          </section>
          <section className='panel' style={{ marginBottom: 24 }}>
            <h2>Arzt-Ausfall</h2>
            <ul>
              <li><a href='/praxis/arzt-ausfall'>Ausfall erfassen &amp; betroffene Termine anzeigen</a></li>
            </ul>
          </section>
          <section className='panel' style={{ marginBottom: 24 }}>
            <h2>No-Show-Tracking</h2>
            <ul>
              <li><a href='/praxis/noshow'>No-Shows erfassen &amp; Übersicht</a></li>
            </ul>
          </section>
        </>
      )}

      {istArzt(session) && (
        <section className='panel' style={{ marginBottom: 24 }}>
          <h2>Ärztliche Aufgaben</h2>
          <ul>
            <li><a href='/praxis/rezeptfreigaben'>Offene Rezeptfreigaben</a></li>
            <li><a href='/praxis/sperrzeiten'>Eigene Abwesenheiten eintragen</a></li>
          </ul>
        </section>
      )}

      {istAdmin(session) && (
        <>
          <section className='panel' style={{ marginBottom: 24 }}>
            <h2>Sprechzeiten</h2>
            <ul>
              <li><a href='/praxis/sprechzeiten'>Sprechzeiten verwalten</a></li>
            </ul>
          </section>
          <section className='panel' style={{ marginBottom: 24 }}>
            <h2>Sperrzeiten</h2>
            <ul>
              <li><a href='/praxis/sperrzeiten'>Sperrzeiten verwalten</a></li>
            </ul>
          </section>
          <section className='panel' style={{ marginBottom: 24 }}>
            <h2>Verwaltung</h2>
            <ul>
              <li><a href='/praxis/termintypen'>Termintypen verwalten</a></li>
              <li><a href='/praxis/termintyp-zuordnung'>Termintyp-Arzt-Zuordnung verwalten</a></li>
              <li><a href='/praxis/praxisregeln'>Praxisregeln verwalten</a></li>
              <li><a href='/praxis/wiederholungsrezepte'>Wiederholungsrezepte (Übersicht)</a></li>
            </ul>
          </section>
        </>
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
