import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { istMfaOderAdmin } from '@/lib/rollen';
import { prisma } from '@/lib/prisma';
import WiederholungsrezeptImport from './WiederholungsrezeptImport';

export default async function WiederholungsrezeptePage() {
  const session = await getSession();
  if (!session || session.type !== 'praxis' || !istMfaOderAdmin(session)) redirect('/login');

  const rezepte = await prisma.wiederholungsrezept.findMany({
    include: { patient: { select: { name: true, internePatientennummer: true } } },
    orderBy: { letzteAktualisierung: 'desc' },
  });

  return (
    <div className='page'>
      <section className='intro'>
        <p className='eyebrow'>Praxis Demir &amp; Kollegen</p>
        <h1>Wiederholungsrezepte (PVS)</h1>
        <p>&Uuml;bersicht der Rezept-Status aus dem PVS</p>
      </section>

      <section className='panel' style={{marginBottom:24}}>
        {rezepte.length === 0 ? (
          <p>Keine Rezeptdaten vorhanden. Rezept-Status wird nach PVS-Import angezeigt.</p>
        ) : (
          <table className='patient-daten' style={{width:'100%'}}>
            <thead>
              <tr>
                <th>Patient</th>
                <th>PVS-Nr.</th>
                <th>Status</th>
                <th>Letzte Aktualisierung</th>
                <th>Bemerkung</th>
              </tr>
            </thead>
            <tbody>
              {rezepte.map(r => (
                <tr key={r.id}>
                  <td>{r.patient.name}</td>
                  <td style={{fontSize:'0.85rem'}}>{r.patient.internePatientennummer}</td>
                  <td>
                    <span style={{
                      padding:'2px 8px', borderRadius:4, fontSize:'0.85rem',
                      background: r.rezeptStatus === 'abholbereit' ? '#e8f5e9' : r.rezeptStatus === 'abgeholt' ? '#e0e0e0' : '#fff8e1',
                      color: r.rezeptStatus === 'abholbereit' ? '#2e7d32' : r.rezeptStatus === 'abgeholt' ? '#666' : '#f57f17',
                    }}>
                      {r.rezeptStatus === 'ausstehend' ? 'Ausstehend' : r.rezeptStatus === 'abholbereit' ? 'Abholbereit' : 'Abgeholt'}
                    </span>
                  </td>
                  <td style={{fontSize:'0.85rem'}}>{r.letzteAktualisierung.toLocaleString('de-DE')}</td>
                  <td style={{fontSize:'0.85rem'}}>{r.bemerkung ?? '\u2014'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <WiederholungsrezeptImport />

      <section className='panel'>
        <h2>Patient:in &ouml;ffnen</h2>
        <p><a href='/praxis/konten-anlegen'>Zum PatientenKonto-Bereich</a></p>
      </section>
    </div>
  );
}

