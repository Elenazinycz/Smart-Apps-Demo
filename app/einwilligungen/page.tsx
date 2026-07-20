import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import EinwilligungForm from './EinwilligungForm';

export default async function EinwilligungenPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.type !== 'patient') {
    return <div className="page"><p>Dieser Bereich ist nur für Patient:innen.</p></div>;
  }

  const patient = await prisma.patient.findUnique({
    where: { id: session.id },
    select: {
      email: true,
      telefonnummer: true,
      einwilligungEmail: true,
      einwilligungSms: true,
    },
  });
  if (!patient) return <div className="page"><p>Patient nicht gefunden.</p></div>;

  return (
    <div className="page">
      <section className="intro">
        <p className="eyebrow">Praxis Demir &amp; Kollegen</p>
        <h1>Einwilligungen für Benachrichtigungen</h1>
        <p style={{ fontSize: '0.85rem', color: '#555', marginBottom: 12 }}>
          Sie können hier festlegen, ob Sie Benachrichtigungen per E-Mail und/oder SMS erhalten möchten
          (Buchungsbestätigung, Stornierung, Umbuchung, Terminerinnerung).
        </p>
      </section>
      <section className="panel" style={{ marginBottom: 24 }}>
        <EinwilligungForm
          einwilligungEmail={patient.einwilligungEmail}
          einwilligungSms={patient.einwilligungSms}
          email={patient.email}
          telefonnummer={patient.telefonnummer}
        />
      </section>
    </div>
  );
}
