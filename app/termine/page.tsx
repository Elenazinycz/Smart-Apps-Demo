import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import TerminListeClient from './TerminListeClient';

function fmtDate(d: Date) {
  return d.toLocaleDateString('de-DE');
}
function fmtTime(d: Date) {
  return d.toLocaleTimeString('de-DE', {hour:'2-digit', minute:'2-digit'});
}

export default async function TerminePage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.type !== 'patient') {
    return <div className="page"><p>Dieser Bereich ist nur für Patient:innen.</p></div>
  }

  const [patient, gebuchte] = await Promise.all([
    prisma.patient.findUnique({
      where: { id: session.id },
      select: { name: true, geburtsdatum: true, versicherungsart: true, email: true, telefonnummer: true, einwilligungEmail: true, einwilligungSms: true, noShowZaehlerJahr: true, status: true },
    }),
    prisma.terminSlot.findMany({
      where: { patientId: session.id, status: 'gebucht', datum: { gte: (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })() } },
      include: { arzt: { select: { name: true } }, terminTyp: { select: { bezeichnung: true, dauerStandardMinuten: true } } },
      orderBy: { datum: 'asc' },
    }),
  ]);

  return (
    <div className="page">
      <section className="intro">
        <p className="eyebrow">Praxis Demir &amp; Kollegen</p>
        <h1>Meine Termine</h1>
        <p>Willkommen, <strong>{session.name}</strong></p>
      </section>

      {patient && (
        <section className="panel" style={{marginBottom:24}}>
          <h2>Meine Daten</h2>
          <table className="patient-daten">
            <tbody>
              <tr><td>Name</td><td>{patient.name}</td></tr>
              <tr><td>Geburtsdatum</td><td>{fmtDate(patient.geburtsdatum)}</td></tr>
              <tr><td>Versicherung</td><td>{patient.versicherungsart}</td></tr>
              <tr><td>E-Mail</td><td>{patient.email ?? '\u2014'}</td></tr>
              <tr><td>E-Mail-Opt-in</td><td>{patient.einwilligungEmail ? 'Ja' : 'Nein'}</td></tr>
              <tr><td>SMS-Opt-in</td><td>{patient.einwilligungSms ? 'Ja' : 'Nein'}</td></tr>
              <tr><td>No-Shows (dieses Jahr)</td><td>{patient.noShowZaehlerJahr}</td></tr>
              <tr><td>Status</td><td>{patient.status === 'aktiv' ? 'Aktiv' : 'Gesperrt'}</td></tr>
            </tbody>
          </table>
          <p style={{marginTop:12}}>
            <a href="/einwilligungen" style={{color:'var(--accent)'}}>Einwilligungen für Benachrichtigungen bearbeiten &rarr;</a>
          </p>
        </section>
      )}

      <section className="panel" style={{marginBottom:24}}>
        <h2>Meine Termine</h2>
        {gebuchte.length === 0 ? (
          <p>Keine bevorstehenden Termine.</p>
        ) : (
          <TerminListeClient termine={gebuchte} />
        )}
      </section>

      <section className="panel">
        <h2>Neuen Termin buchen</h2>
        <p><a href="/termine/buchen">Hier klicken, um einen neuen Termin zu buchen</a></p>
      </section>
    </div>
  );
}
