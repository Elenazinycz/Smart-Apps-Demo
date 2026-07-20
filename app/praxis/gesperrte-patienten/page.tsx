"use client";

import { useCallback, useEffect, useState } from "react";

type GesperrterPatient = {
  patientId: string;
  patientName: string;
  geburtsdatum: string;
  telefonnummer: string;
  email: string | null;
  noShowZaehlerJahr: number;
  kontoErstelltAm: string;
  letzterLogin: string | null;
};

type ApiResponse = {
  patienten: GesperrterPatient[];
};

export default function GesperrtePatientenPage() {
  const [patienten, setPatienten] = useState<GesperrterPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const laden = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/gesperrte-patienten");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Fehler beim Laden");
      }
      const json: ApiResponse = await res.json();
      setPatienten(json.patienten);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    laden();
  }, [laden]);

  function formatDatum(iso: string): string {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("de-DE");
  }

  return (
    <div className="page">
      <section className="intro">
        <p className="eyebrow">Smart-Apps-Demo</p>
        <h1>Gesperrte Patient:innen</h1>
        <p>
          &Uuml;bersicht aller Patient:innen, deren Online-Buchung gesperrt ist.
        </p>
      </section>

      {error && (
        <section className="panel" style={{ marginBottom: 20 }}>
          <p style={{ color: "#dc2626" }}>{error}</p>
        </section>
      )}

      <section className="panel">
        {loading ? (
          <p className="empty-state">Lade gesperrte Patient:innen ...</p>
        ) : patienten.length === 0 ? (
          <p className="empty-state">Keine Patient:innen mit gesperrter Online-Buchung.</p>
        ) : (
          <>
            <p style={{ marginBottom: 12, color: "#555" }}>
              <strong>{patienten.length}</strong> Patient:in(nen) mit Buchungssperre
            </p>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Patient:in</th>
                    <th>Geburtsdatum</th>
                    <th>Telefon</th>
                    <th>No-Shows (Jahr)</th>
                    <th>Konto erstellt</th>
                    <th>Letzter Login</th>
                  </tr>
                </thead>
                <tbody>
                  {patienten.map((p) => (
                    <tr key={p.patientId}>
                      <td><strong>{p.patientName}</strong></td>
                      <td>{formatDatum(p.geburtsdatum)}</td>
                      <td>{p.telefonnummer}</td>
                      <td>
                        <span style={{ fontWeight: 600, color: "#dc2626" }}>
                          {p.noShowZaehlerJahr}
                        </span>
                      </td>
                      <td>{formatDatum(p.kontoErstelltAm)}</td>
                      <td>{p.letzterLogin ? formatDatum(p.letzterLogin) : <span style={{ color: "#999" }}>&mdash;</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <section className="panel" style={{ marginTop: 20 }}>
        <h2>Hinweis</h2>
        <p style={{ fontSize: "0.9em", color: "#555" }}>
          Die Entsperrung erfolgt im Bereich <a href="/praxis/noshow">No-Show-Tracking</a>.
          Dort k&ouml;nnen MFAs/Admins die Sperre manuell aufheben und den Z&auml;hler zur&uuml;cksetzen.
        </p>
      </section>
    </div>
  );
}