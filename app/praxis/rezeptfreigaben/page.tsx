"use client";

import { useCallback, useEffect, useState } from "react";

type Rezept = {
  id: string;
  patientId: string;
  rezeptStatus: string;
  letzteAktualisierung: string;
  bemerkung: string | null;
  patient: {
    name: string;
    internePatientennummer: string;
    geburtsdatum: string;
  };
};

type ApiResponse = {
  rezepte: Rezept[];
};

function formatDatum(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("de-DE");
}

export default function RezeptfreigabenPage() {
  const [rezepte, setRezepte] = useState<Rezept[]>([]);
  const [loading, setLoading] = useState(true);
  const [aktionLoading, setAktionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const laden = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/rezeptfreigaben");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Fehler beim Laden");
      }
      const json: ApiResponse = await res.json();
      setRezepte(json.rezepte);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    laden();
  }, [laden]);

  const handleAktion = async (rezeptId: string, aktion: "freigeben" | "ablehnen") => {
    setAktionLoading(rezeptId);
    setError(null);
    setMessage(null);

    try {
      const csrfRes = await fetch("/api/csrf");
      const csrfData = await csrfRes.json();

      const res = await fetch("/api/rezeptfreigaben", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfData.token,
        },
        body: JSON.stringify({ rezeptId, aktion }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Fehler bei Aktion");

      setMessage(body.message);
      await laden();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setAktionLoading(null);
    }
  };

  return (
    <div className="page">
      <section className="intro">
        <p className="eyebrow">Smart-Apps-Demo</p>
        <h1>Offene Rezeptfreigaben</h1>
        <p>
          Ausstehende Wiederholungsrezepte, die auf Freigabe oder Ablehnung durch
          &Auml;rzt:innen warten.
        </p>
      </section>

      {error && (
        <section className="panel" style={{ marginBottom: 20 }}>
          <p style={{ color: "#dc2626" }}>{error}</p>
        </section>
      )}

      {message && (
        <section className="panel" style={{ marginBottom: 20 }}>
          <p style={{ color: "#16a34a" }}>{message}</p>
        </section>
      )}

      <section className="panel">
        {loading ? (
          <p className="empty-state">Lade offene Rezeptfreigaben ...</p>
        ) : rezepte.length === 0 ? (
          <p className="empty-state">Keine ausstehenden Rezeptfreigaben.</p>
        ) : (
          <>
            <p style={{ marginBottom: 12, color: "#555" }}>
              <strong>{rezepte.length}</strong> ausstehende Freigabe(n)
            </p>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Patient:in</th>
                    <th>Geburtsdatum</th>
                    <th>Letzte Aktualisierung</th>
                    <th>Aktion</th>
                  </tr>
                </thead>
                <tbody>
                  {rezepte.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <strong>{r.patient.name}</strong>
                        <br />
                        <span style={{ fontSize: "0.85rem", color: "#999" }}>
                          PVS-Nr. {r.patient.internePatientennummer}
                        </span>
                      </td>
                      <td>{formatDatum(r.patient.geburtsdatum)}</td>
                      <td style={{ fontSize: "0.85rem" }}>
                        {formatDatum(r.letzteAktualisierung)}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => handleAktion(r.id, "freigeben")}
                            disabled={aktionLoading === r.id}
                            className="btn btn-primary"
                            style={{ padding: "4px 12px", fontSize: "0.85rem" }}
                          >
                            {aktionLoading === r.id ? "..." : "Freigeben"}
                          </button>
                          <button
                            onClick={() => handleAktion(r.id, "ablehnen")}
                            disabled={aktionLoading === r.id}
                            className="btn btn-danger"
                            style={{ padding: "4px 12px", fontSize: "0.85rem" }}
                          >
                            {aktionLoading === r.id ? "..." : "Ablehnen"}
                          </button>
                        </div>
                      </td>
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
          &Auml;rzt:innen sehen hier alle Wiederholungsrezepte mit Status
          &bdquo;ausstehend&ldquo; und k&ouml;nnen diese freigeben oder ablehnen.
          Nach Freigabe wird der Rezept-Status auf &bdquo;abholbereit&ldquo; gesetzt.
          Nach Ablehnung auf &bdquo;abgeholt&ldquo;.
        </p>
      </section>
    </div>
  );
}