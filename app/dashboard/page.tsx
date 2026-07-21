import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { istMfaOderAdmin, istArzt, istAdmin, rolleAnzeige } from '@/lib/rollen';
import LogoutButton from './LogoutButton';

function fmtDate(d: Date) {
  return d.toLocaleDateString('de-DE');
}
function fmtTime(d: Date) {
  return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  // ── Praxis-Ansicht ──
  if (session.type === 'praxis') {
    return (
      <div className="page">
        <section className="intro">
          <p className="eyebrow">Praxis Demir &amp; Kollegen</p>
          <h1>Dashboard</h1>
          <p>Angemeldet als <strong>{session.name}</strong> — Rolle: {rolleAnzeige(session.rolle)}</p>
          <LogoutButton />
        </section>

        {istMfaOderAdmin(session) && (
          <>
            <section className="panel" style={{ marginBottom: 24 }}>
              <h2>Übersichten (Tagesliste &amp; Live)</h2>
              <ul>
                <li><a href="/praxis/tagesliste">Tagesliste anzeigen (alle Termine)</a></li>
                <li><a href="/praxis/akutslots-live">Freie Akutslots (Live)</a></li>
                <li><a href="/praxis/gesperrte-patienten">Gesperrte Patient:innen</a></li>
                <li><a href="/praxis/wiederholungsrezepte">Wiederholungsrezepte (Übersicht)</a></li>
              </ul>
            </section>
            <section className="panel" style={{ marginBottom: 24 }}>
              <h2>PatientenKonten</h2>
              <ul>
                <li><a href="/praxis/konten-anlegen">Neues PatientenKonto anlegen</a></li>
              </ul>
            </section>
            <section className="panel" style={{ marginBottom: 24 }}>
              <h2>Akutslots</h2>
              <ul>
                <li><a href="/praxis/akutslots">Akutslots verwalten &amp; freigeben</a></li>
              </ul>
            </section>
            <section className="panel" style={{ marginBottom: 24 }}>
              <h2>No-Show-Tracking</h2>
              <ul>
                <li><a href="/praxis/noshow">No-Shows erfassen &amp; Übersicht</a></li>
              </ul>
            </section>
          </>
        )}

        {istArzt(session) && (
          <section className="panel" style={{ marginBottom: 24 }}>
            <h2>Ärztliche Aufgaben</h2>
            <ul>
              <li><a href="/praxis/rezeptfreigaben">Offene Rezeptfreigaben</a></li>
              <li><a href="/praxis/sperrzeiten">Eigene Abwesenheiten eintragen</a></li>
            </ul>
          </section>
        )}

        {istAdmin(session) && (
          <>
            <section className="panel" style={{ marginBottom: 24 }}>
              <h2>Sprechzeiten</h2>
              <ul>
                <li><a href="/praxis/sprechzeiten">Sprechzeiten verwalten</a></li>
              </ul>
            </section>
            <section className="panel" style={{ marginBottom: 24 }}>
              <h2>Sperrzeiten</h2>
              <ul>
                <li><a href="/praxis/sperrzeiten">Sperrzeiten verwalten</a></li>
              </ul>
            </section>
            <section className="panel" style={{ marginBottom: 24 }}>
              <h2>Verwaltung</h2>
              <ul>
                <li><a href="/praxis/termintypen">Termintypen verwalten</a></li>
                <li><a href="/praxis/termintyp-zuordnung">Termintyp-Arzt-Zuordnung verwalten</a></li>
                <li><a href="/praxis/praxisregeln">Praxisregeln verwalten</a></li>
                <li><a href="/praxis/wiederholungsrezepte">Wiederholungsrezepte (Übersicht)</a></li>
              </ul>
            </section>
          </>
        )}
      </div>
    );
  }

  // ── Patient:innen-Ansicht ──
  const patient = await prisma.patient.findUnique({
    where: { id: session.id },
    select: {
      name: true,
      versicherungsart: true,
      noShowZaehlerJahr: true,
      status: true,
    },
  });

  const naechsteTermine = await prisma.terminSlot.findMany({
    where: {
      patientId: session.id,
      status: 'gebucht',
      datum: { gte: new Date() },
    },
    include: {
      arzt: { select: { name: true } },
      terminTyp: { select: { bezeichnung: true, dauerStandardMinuten: true } },
    },
    orderBy: { datum: 'asc' },
  });

  return (
    <div className="page">
      <section className="intro">
        <p className="eyebrow">Praxis Demir &amp; Kollegen</p>
        <h1>Hallo {session.name}</h1>
        <p>Willkommen in Ihrem Patienten-Dashboard.</p>
        <LogoutButton />
      </section>

      {/* Stammdaten */}
      {patient && (
        <section className="panel" style={{ marginBottom: 24 }}>
          <h2>Ihre Stammdaten</h2>
          <table className="patient-daten">
            <tbody>
              <tr><td>Versicherungsart</td><td>{patient.versicherungsart}</td></tr>
              <tr><td>No-Shows (dieses Jahr)</td><td>{patient.noShowZaehlerJahr}</td></tr>
              <tr><td>Status</td><td>{patient.status === 'aktiv' ? 'Aktiv' : 'Gesperrt'}</td></tr>
            </tbody>
          </table>
        </section>
      )}

      {/* Termin-Übersicht */}
      <section className="panel" style={{ marginBottom: 24 }}>
        <h2>Ihre aktuellen Termine</h2>
        {naechsteTermine.length === 0 ? (
          <p>Keine bevorstehenden Termine.</p>
        ) : (
          <table className="termin-tabelle">
            <thead>
              <tr>
                <th>Datum/Zeit</th>
                <th>Arzt</th>
                <th>Typ</th>
              </tr>
            </thead>
            <tbody>
              {naechsteTermine.map((t) => (
                <tr key={t.id}>
                  <td>{fmtDate(new Date(t.datum))} {fmtTime(new Date(t.startzeit))}</td>
                  <td>{t.arzt.name}</td>
                  <td>{t.terminTyp.bezeichnung} ({t.terminTyp.dauerStandardMinuten} min)</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p style={{ marginTop: 12 }}>
          <a href="/termine" style={{ color: 'var(--accent)' }}>Alle Termine verwalten &rarr;</a>
        </p>
      </section>

      {/* Aktionen */}
      <section className="panel" style={{ marginBottom: 24 }}>
        <h2>Aktionen</h2>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <a href="/einwilligungen" className="btn btn-primary">
            Einwilligungen bearbeiten
          </a>
          <a href="/termine/buchen" className="btn btn-primary">
            Termin buchen
          </a>
        </div>
      </section>
    </div>
  );
}
