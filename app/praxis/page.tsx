import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { istAdmin, istMfaOderAdmin, istArzt, rolleAnzeige, hatRolle } from '@/lib/rollen';
import { ROLLE } from '@/lib/constants';
import { prisma } from '@/lib/prisma';

async function tageslisteKurz(limit = 10) {
  const heute = new Date();
  const start = new Date(heute.getFullYear(), heute.getMonth(), heute.getDate(), 0, 0, 0, 0);
  const ende = new Date(start);
  ende.setHours(23, 59, 59, 999);

  const slots = await prisma.terminSlot.findMany({
    where: {
      datum: { gte: start, lte: ende },
      status: "gebucht",
      patientId: { not: null },
    },
    include: {
      patient: { select: { id: true, name: true } },
      arzt: { select: { name: true } },
      terminTyp: { select: { bezeichnung: true } },
    },
    orderBy: { startzeit: "asc" },
    take: limit,
  });

  return slots.map((s) => ({
    id: s.id,
    startzeit: s.startzeit.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
    patientName: s.patient?.name ?? "—",
    arztName: s.arzt.name,
    terminTyp: s.terminTyp.bezeichnung,
  }));
}

async function wiederholungsrezepteKurz(limit = 10) {
  const rezepte = await prisma.wiederholungsrezept.findMany({
    where: { rezeptStatus: { not: 'abgeholt' } },
    include: { patient: { select: { name: true } } },
    orderBy: { letzteAktualisierung: 'desc' },
    take: limit,
  });

  return {
    rezepte: rezepte.map((r) => ({
      id: r.id,
      patientName: r.patient.name,
      status: r.rezeptStatus,
    })),
    anzahlOffen: rezepte.length,
  };
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    ausstehend: "Ausstehend",
    abholbereit: "Abholbereit",
    abgeholt: "Abgeholt",
  };
  return map[status] ?? status;
}

export default async function PraxisPage() {
  const session = await getSession();
  if (!session || session.type !== 'praxis') redirect('/login');

  let termineKurz: Awaited<ReturnType<typeof tageslisteKurz>> = [];
  let rezeptDaten: Awaited<ReturnType<typeof wiederholungsrezepteKurz>> = { rezepte: [], anzahlOffen: 0 };

  const showLiveData = hatRolle(session, [ROLLE.MFA, ROLLE.ADMIN]);
  if (showLiveData) {
    const [termine, rezepte] = await Promise.all([
      tageslisteKurz(10),
      wiederholungsrezepteKurz(10),
    ]);
    termineKurz = termine;
    rezeptDaten = rezepte;
  }

  return (
    <div className="page">
      <section className="intro">
        <p className="eyebrow">Praxis Demir &amp; Kollegen</p>
        <h1>Praxis-Bereich</h1>
        <p>Angemeldet als <strong>{session.name}</strong> — Rolle: {rolleAnzeige(session.rolle ?? '')}</p>
      </section>

      {istMfaOderAdmin(session) && (
        <>
          <section className="panel" style={{ marginBottom: 24 }}>
            <h2>
              Heutige Termine{" "}
              <small style={{ fontWeight: 400, color: "#666" }}>
                (nächste {Math.min(termineKurz.length, 10)})
              </small>
            </h2>
            {termineKurz.length === 0 ? (
              <p style={{ color: "#888" }}>Keine Termine für heute.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #ddd", textAlign: "left" }}>
                    <th style={{ padding: "6px 8px" }}>Uhrzeit</th>
                    <th style={{ padding: "6px 8px" }}>Patient:in</th>
                    <th style={{ padding: "6px 8px" }}>Arzt</th>
                    <th style={{ padding: "6px 8px" }}>Termintyp</th>
                  </tr>
                </thead>
                <tbody>
                  {termineKurz.map((t) => (
                    <tr key={t.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                      <td style={{ padding: "6px 8px", whiteSpace: "nowrap" }}>{t.startzeit}</td>
                      <td style={{ padding: "6px 8px" }}>{t.patientName}</td>
                      <td style={{ padding: "6px 8px" }}>{t.arztName}</td>
                      <td style={{ padding: "6px 8px" }}>{t.terminTyp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {termineKurz.length > 0 && (
              <p style={{ marginTop: 8 }}>
                <a href="/praxis/tagesliste">
                  Alle anzeigen (heutige Termine)
                </a>
              </p>
            )}
          </section>

          <section className="panel" style={{ marginBottom: 24 }}>
            <h2>
              Offene Wiederholungsrezepte{" "}
              <small style={{ fontWeight: 400, color: "#666" }}>
                ({rezeptDaten.anzahlOffen})
              </small>
            </h2>
            {rezeptDaten.rezepte.length === 0 ? (
              <p style={{ color: "#888" }}>Keine offenen Wiederholungsrezepte.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #ddd", textAlign: "left" }}>
                    <th style={{ padding: "6px 8px" }}>Patient:in</th>
                    <th style={{ padding: "6px 8px" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rezeptDaten.rezepte.map((r) => (
                    <tr key={r.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                      <td style={{ padding: "6px 8px" }}>{r.patientName}</td>
                      <td style={{ padding: "6px 8px" }}>{statusLabel(r.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <p style={{ marginTop: 8 }}>
              <a href="/praxis/wiederholungsrezepte">Alle anzeigen</a>
            </p>
          </section>

          <section className="panel" style={{ marginBottom: 24 }}>
            <h2>Weitere Übersichten</h2>
            <ul>
              <li><a href="/praxis/tagesliste">Tagesliste anzeigen (alle Termine)</a></li>
              <li><a href="/praxis/akutslots-live">Freie Akutslots (Live)</a></li>
              <li><a href="/praxis/gesperrte-patienten">Gesperrte Patient:innen</a></li>
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
            <h2>Arzt-Ausfall</h2>
            <ul>
              <li><a href="/praxis/arzt-ausfall">Ausfall erfassen &amp; betroffene Termine anzeigen</a></li>
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
            </ul>
          </section>
        </>
      )}

      <section className="panel" style={{ marginBottom: 24 }}>
        <h2>Navigation</h2>
        <ul>
                    <li><a href="/">Startseite</a></li>
        </ul>
      </section>
    </div>
  );
}
