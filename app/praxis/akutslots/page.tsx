"use client";

import { useCallback, useEffect, useState } from "react";

type Arzt = { id: string; name: string; fachrichtung: string };
type Patient = { id: string; name: string };
type AkutSlot = {
  id: string;
  datum: string;
  startzeit: string;
  endzeit: string;
  status: string;
  slotArt: string;
  buchungsquelle: string | null;
  arzt: Arzt;
  patient: Patient | null;
  terminTyp: { id: string; bezeichnung: string };
};

type ApiResponse = {
  slots: AkutSlot[];
  aerzte: Arzt[];
};

function formatZeit(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

export default function AkutslotsPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [freigabeLoading, setFreigabeLoading] = useState(false);
  const [selectedArztId, setSelectedArztId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const laden = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/akutslots");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Fehler beim Laden");
      }
      const json: ApiResponse = await res.json();
      setData(json);
      // Vorschlag: ersten aktiven Arzt vorwaehlen
      if (!selectedArztId && json.aerzte.length > 0) {
        setSelectedArztId(json.aerzte[0].id);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }, [selectedArztId]);

  useEffect(() => {
    laden();
  }, []);

  const handleFreigabe = async () => {
    if (!selectedArztId) {
      setError("Bitte einen diensthabenden Arzt auswaehlen.");
      return;
    }
    setFreigabeLoading(true);
    setMessage(null);
    setError(null);

    try {
      const csrfRes = await fetch("/api/csrf");
      const csrfData = await csrfRes.json();
      const res = await fetch("/api/akutslots", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfData.token },
        body: JSON.stringify({ arztId: selectedArztId }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Fehler bei Freigabe");

      setMessage(body.message + (body.neuAngelegt ? " (" + body.anzahl + " Slots)" : ""));
      await laden();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setFreigabeLoading(false);
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

  if (loading && !data) {
    return <div className="page"><p className="loading">Lade Akutslots ...</p></div>;
  }

  const slotsHeute = data?.slots || [];
  const hatFreigabe = slotsHeute.length > 0;
  const freieSlots = slotsHeute.filter((s) => s.status === "frei");
  const gebuchteSlots = slotsHeute.filter((s) => s.status !== "frei");

  return (
    <div className="page">
      <section className="intro">
        <p className="eyebrow">Praxis-Bereich</p>
        <h1>Akutslots verwalten</h1>
        <p>Hier koennen MFAs die taeglichen Akutslots freigeben und den diensthabenden Arzt zuweisen.</p>
      </section>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      {/* Freigabe-Bereich */}
      <section className="panel" style={{ marginBottom: 24 }}>
        <h2>{hatFreigabe ? "Diensthabenden Arzt aendern" : "Akutslots freigeben"}</h2>
        <p style={{ marginBottom: 12, color: "#555" }}>
          {hatFreigabe
            ? "Die Akutslots fuer heute wurden bereits freigegeben. Sie koennen den diensthabenden Arzt aendern."
            : "Noch keine Akutslots fuer heute freigegeben. Waehlen Sie den diensthabenden Arzt und geben Sie die Slots frei."}
        </p>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <label htmlFor="arzt-select" style={{ fontWeight: 600 }}>Diensthabender Arzt:</label>
          <select
            id="arzt-select"
            value={selectedArztId}
            onChange={(e) => setSelectedArztId(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc", minWidth: 220 }}
          >
            {data?.aerzte.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.fachrichtung})
              </option>
            ))}
          </select>
          <button
            onClick={handleFreigabe}
            disabled={freigabeLoading || !selectedArztId}
            className="btn btn-primary"
          >
            {freigabeLoading ? "Wird gespeichert ..." : hatFreigabe ? "Arzt aktualisieren" : "Akutslots freigeben"}
          </button>
        </div>
      </section>

      {/* Uebersicht */}
      <section className="panel">
        <h2>Akutslots &ndash; heute ({slotsHeute.length} Slots)</h2>

        {slotsHeute.length === 0 ? (
          <p className="empty-state">Noch keine Akutslots fuer heute. Bitte oben freigeben.</p>
        ) : (
          <>
            <p style={{ marginBottom: 12, color: "#555" }}>
              <strong>{freieSlots.length}</strong> frei, <strong>{gebuchteSlots.length}</strong> belegt
              &nbsp;&middot; Diensthabend: <strong>{slotsHeute[0]?.arzt.name}</strong>
            </p>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Zeit</th>
                    <th>Status</th>
                    <th>Patient:in</th>
                    <th>Buchungsweg</th>
                  </tr>
                </thead>
                <tbody>
                  {slotsHeute.map((slot) => (
                    <tr key={slot.id}>
                      <td>{formatZeit(slot.startzeit)}&ndash;{formatZeit(slot.endzeit)}</td>
                      <td><span className={`badge ${statusBadge(slot.status)}`}>{slot.status}</span></td>
                      <td>{slot.patient ? slot.patient.name : <span style={{ color: "#999" }}>&mdash;</span>}</td>
                      <td>{slot.buchungsquelle || <span style={{ color: "#999" }}>&mdash;</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <section className="panel" style={{ marginTop: 24 }}>
        <h2>Info</h2>
        <ul style={{ fontSize: "0.9em", color: "#555" }}>
          <li>Akutslots sind nicht online buchbar &ndash; die Vergabe erfolgt ausschliesslich ueber telefonische MFA-Triage.</li>
          <li>Pro Tag werden maximal 8 Akutslots freigegeben (4 vormittags, 4 nachmittags).</li>
          <li>Bei Arzt-Ausfall werden Akutslots gesperrt (siehe F-BETR-4).</li>
        </ul>
      </section>
    </div>
  );
}

