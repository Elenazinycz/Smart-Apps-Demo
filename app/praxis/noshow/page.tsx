"use client";

import { useCallback, useEffect, useState } from "react";

type NoShowSlot = {
  id: string;
  datum: string;
  startzeit: string;
  endzeit: string;
  status: string;
  patient: { id: string; name: string } | null;
  arzt: { name: string };
  terminTyp: { bezeichnung: string };
};

type ApiSlotsResponse = {
  slots: NoShowSlot[];
};

type NoShowPatient = {
  patientId: string;
  patientName: string;
  noShowZaehlerJahr: number;
  buchungsStatus: string;
  noShows: {
    slotId: string;
    datum: string;
    startzeit: string;
    arztName: string;
    terminTypName: string;
  }[];
};

type ApiUebersichtResponse = {
  patienten: NoShowPatient[];
};

function formatZeit(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

function formatDatum(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("de-DE");
}

export default function NoShowPage() {
  const [slots, setSlots] = useState<NoShowSlot[]>([]);
  const [uebersicht, setUebersicht] = useState<NoShowPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [markLoading, setMarkLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"markieren" | "uebersicht">("markieren");

  const laden = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [slotsRes, uebersichtRes] = await Promise.all([
        fetch("/api/noshow/slots"),
        fetch("/api/noshow"),
      ]);

      if (!slotsRes.ok) {
        const body = await slotsRes.json().catch(() => ({}));
        throw new Error(body.error || "Fehler beim Laden der Slots");
      }
      if (!uebersichtRes.ok) {
        const body = await uebersichtRes.json().catch(() => ({}));
        throw new Error(body.error || "Fehler beim Laden der Uebersicht");
      }

      const slotsJson: ApiSlotsResponse = await slotsRes.json();
      const uebersichtJson: ApiUebersichtResponse = await uebersichtRes.json();

      setSlots(slotsJson.slots);
      setUebersicht(uebersichtJson.patienten);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    laden();
  }, [laden]);

  const handleMarkNoShow = async (slotId: string) => {
    setMarkLoading(slotId);
    setMessage(null);
    setError(null);

    try {
      const csrfRes = await fetch("/api/csrf");
      const csrfData = await csrfRes.json();

      const res = await fetch("/api/noshow/mark", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfData.token,
        },
        body: JSON.stringify({ slotId }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Fehler bei No-Show-Markierung");

      const teile = ["No-Show erfasst."];
      if (body.noShowZaehlerNeu) {
        teile.push(`Neuer Zaehlerstand: ${body.noShowZaehlerNeu}.`);
      }
      if (body.erinnerungGesendet) {
        teile.push("Erinnerung wurde versendet.");
      }
      if (body.buchungGesperrt) {
        teile.push("Online-Buchung wurde gesperrt (3 No-Shows erreicht).");
      }
      setMessage(teile.join(" "));

      // Neu laden
      await laden();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setMarkLoading(null);
    }
  };

  const handleEntSperren = async (patientId: string) => {
    setError(null);
    setMessage(null);

    if (!confirm("Sperre fuer diesen Patienten aufheben und Zaehler zuruecksetzen?")) return;

    try {
      const csrfRes = await fetch("/api/csrf");
      const csrfData = await csrfRes.json();

      const res = await fetch("/api/noshow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfData.token,
        },
        body: JSON.stringify({ patientId, noShowZaehlerReset: 0 }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Fehler bei Entsperrung");

      setMessage("Patient erfolgreich entsperrt und Zaehler zurueckgesetzt.");
      await laden();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      frei: "frei-badge",
      gebucht: "gebucht-badge",
      abgesagt: "abgesagt-badge",
      gesperrt: "gesperrt-badge",
      noShow: "abgesagt-badge",
      umbuchungErforderlich: "gesperrt-badge",
    };
    return map[status] || "frei-badge";
  };

  if (loading && slots.length === 0 && uebersicht.length === 0) {
    return (
      <div className="page">
        <p className="loading">Lade No-Show-Daten ...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <section className="intro">
        <p className="eyebrow">Praxis-Bereich</p>
        <h1>No-Show-Tracking</h1>
        <p>Hier koennen MFAs/Admins versaeumte Termine als No-Show markieren. Bei 2 No-Shows wird eine Erinnerung gesendet, ab 3 No-Shows wird die Online-Buchung gesperrt (spec.md &sect;16, BR4).</p>
        <p><a href="/praxis">&larr; Zurueck zum Praxis-Bereich</a></p>
      </section>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <button
          onClick={() => setActiveTab("markieren")}
          className={`btn ${activeTab === "markieren" ? "btn-primary" : "btn-secondary"}`}
        >
          No-Show markieren
        </button>
        <button
          onClick={() => setActiveTab("uebersicht")}
          className={`btn ${activeTab === "uebersicht" ? "btn-primary" : "btn-secondary"}`}
        >
          Uebersicht ({uebersicht.length})
        </button>
      </div>

      {/* Tab 1: No-Show markieren */}
      {activeTab === "markieren" && (
        <section className="panel" style={{ marginBottom: 24 }}>
          <h2>Heutige Termine zur No-Show-Markierung</h2>
          <p style={{ marginBottom: 12, color: "#555" }}>
            Angezeigt werden nur gebuchte Termine von heute, deren Startzeit bereits vergangen ist.
          </p>

          {slots.length === 0 ? (
            <p className="empty-state">Keine Termine zur No-Show-Markierung.</p>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Uhrzeit</th>
                    <th>Patient:in</th>
                    <th>Arzt</th>
                    <th>Termintyp</th>
                    <th>Aktion</th>
                  </tr>
                </thead>
                <tbody>
                  {slots.map((slot) => (
                    <tr key={slot.id}>
                      <td>{formatZeit(slot.startzeit)}</td>
                      <td>
                        {slot.patient ? (
                          <strong>{slot.patient.name}</strong>
                        ) : (
                          <span style={{ color: "#999" }}>&mdash;</span>
                        )}
                      </td>
                      <td>{slot.arzt.name}</td>
                      <td>{slot.terminTyp.bezeichnung}</td>
                      <td>
                        <button
                          onClick={() => handleMarkNoShow(slot.id)}
                          disabled={markLoading === slot.id}
                          className="btn btn-danger"
                          style={{ padding: "4px 12px", fontSize: "0.85rem" }}
                        >
                          {markLoading === slot.id ? "Wird markiert ..." : "No-Show"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Tab 2: Uebersicht */}
      {activeTab === "uebersicht" && (
        <section className="panel">
          <h2>Patient:innen mit No-Shows</h2>
          <p style={{ marginBottom: 12, color: "#555" }}>
            Alle Patient:innen mit mindestens einem No-Show im laufenden Jahr.
          </p>

          {uebersicht.length === 0 ? (
            <p className="empty-state">Keine No-Shows erfasst.</p>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Patient:in</th>
                    <th>No-Shows (Jahr)</th>
                    <th>Buchungsstatus</th>
                    <th>Letzte No-Shows</th>
                    <th>Aktion</th>
                  </tr>
                </thead>
                <tbody>
                  {uebersicht.map((p) => (
                    <tr key={p.patientId}>
                      <td><strong>{p.patientName}</strong></td>
                      <td>
                        <span
                          style={{
                            fontWeight: 600,
                            color:
                              p.noShowZaehlerJahr >= 3
                                ? "#dc2626"
                                : p.noShowZaehlerJahr >= 2
                                ? "#d97706"
                                : "#555",
                          }}
                        >
                          {p.noShowZaehlerJahr}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${p.buchungsStatus === "aktiv" ? "frei-badge" : "gesperrt-badge"}`}>
                          {p.buchungsStatus === "aktiv" ? "Aktiv" : "Gesperrt"}
                        </span>
                      </td>
                      <td>
                        {p.noShows.length > 0 ? (
                          <ul style={{ margin: 0, padding: 0, listStyle: "none", fontSize: "0.85rem" }}>
                            {p.noShows.slice(0, 5).map((ns) => (
                              <li key={ns.slotId}>
                                {formatDatum(ns.datum)} {ns.startzeit} &ndash; {ns.arztName} ({ns.terminTypName})
                              </li>
                            ))}
                            {p.noShows.length > 5 && (
                              <li style={{ color: "#999" }}>+ {p.noShows.length - 5} weitere</li>
                            )}
                          </ul>
                        ) : (
                          <span style={{ color: "#999" }}>&mdash;</span>
                        )}
                      </td>
                      <td>
                        {p.buchungsStatus === "gesperrt" && (
                          <button
                            onClick={() => handleEntSperren(p.patientId)}
                            className="btn btn-primary"
                            style={{ padding: "4px 12px", fontSize: "0.85rem" }}
                          >
                            Entsperren
                          </button>
                        )}
                        {p.buchungsStatus !== "gesperrt" && (
                          <span style={{ color: "#999", fontSize: "0.85rem" }}>&mdash;</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <section className="panel" style={{ marginTop: 24 }}>
        <h2>No-Show-Regeln (spec.md &sect;16)</h2>
        <ul style={{ fontSize: "0.9em", color: "#555" }}>
          <li><strong>1. No-Show:</strong> wird gezaehlt.</li>
          <li><strong>2. No-Show/Jahr:</strong> schriftliche Erinnerung wird gesendet (mit Opt-in).</li>
          <li><strong>3. No-Show/Jahr:</strong> Online-Buchung wird gesperrt.</li>
          <li>Rechtzeitige Stornierung gilt nicht als No-Show.</li>
          <li>MFAs/Admins koennen die Sperre manuell aufheben und den Zaehler zuruecksetzen.</li>
        </ul>
      </section>
    </div>
  );
}

