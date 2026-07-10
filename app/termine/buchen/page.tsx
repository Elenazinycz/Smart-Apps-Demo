import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import BuchungsFormular from '../BuchungsFormular';

export default async function BuchenPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.type !== 'patient') {
    return <div className='page'><p>Dieser Bereich ist nur fuer Patient:innen.</p></div>
  }

  return (
    <div className='page'>
      <section className='intro'>
        <p className='eyebrow'>Smart-Apps-Demo</p>
        <h1>Neuen Termin buchen</h1>
        <p><a href='/termine'>&larr; Zurueck zu Meine Termine</a></p>
      </section>
      <section className='panel' style={{marginBottom:24}}>
        <BuchungsFormular />
      </section>
    </div>
  );
}