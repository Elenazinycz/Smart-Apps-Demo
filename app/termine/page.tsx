import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import BuchungsFormular from './BuchungsFormular';
import { prisma } from '@/lib/prisma';

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
    return <div className='page'><p>Dieser Bereich ist nur fÃ¼r Patient:innen.</p></div>
  }

  const gebuchte = await prisma.terminSlot.findMany({
    where: { patientId: session.id, status: 'gebucht', datum: { gte: new Date() } },
    include: { arzt: { select: { name: true } }, terminTyp: { select: { bezeichnung: true, dauerStandardMinuten: true } } },
    orderBy: { datum: 'asc' },
  });

  const rows = gebuchte.map(t => (
    <tr key={t.id}>
      <td>{fmtDate(t.datum)} {fmtTime(t.startzeit)}</td>
      <td>{t.arzt.name}</td>
      <td>{t.terminTyp.bezeichnung} ({t.terminTyp.dauerStandardMinuten} min)</td>
    </tr>
  ));

  return (
    <div className='page'>
      <section className='intro'>
        <p className='eyebrow'>Smart-Apps-Demo</p>
        <h1>Online-Terminbuchung</h1>
        <p>Willkommen, <strong>{session.name}</strong></p>
      </section>
      <section className='panel' style={{marginBottom:24}}>
        <h2>Neuen Termin buchen</h2>
        <BuchungsFormular />
      </section>
      <section className='panel'>
        <h2>Meine Termine</h2>
        {gebuchte.length === 0 ? <p>Keine bevorstehenden Termine.</p> : <table className='termin-tabelle'><thead><tr><th>Datum/Zeit</th><th>Arzt</th><th>Typ</th></tr></thead><tbody>{rows}</tbody></table>}
      </section>
    </div>
  );
}
