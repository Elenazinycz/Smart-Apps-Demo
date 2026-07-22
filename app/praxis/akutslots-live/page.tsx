"use client";

import { useCallback, useEffect, useState, useRef } from "react";

type FreierAkutSlot = {
  id: string;
  startzeit: string;
  endzeit: string;
  status: string;
  arzt: { id: string; name: string };
};

type ApiResponse = {
  slots: FreierAkutSlot[];
};

type PatientTreffer = {
  id: string;
  name: string;
  geburtsdatum: string;
  internePatientennummer: string;
  telefonnummer: string;
};

function formatZeit(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

function formatDatumKurz(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function AkutslotsLivePage() {
  const [slots, setSlots] = useState<FreierAkutSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Buchungsformular-Status
  const [buchFormSlot, setBuchFormSlot] = useState<string | null>(null);
  const [buchSubmitting, setBuchSubmitting] = useState(false);

  // Patienten-Suche
  const [suchQuery, setSuchQuery] = useState("");
  const [suchErgebnis, setSuchErgebnis] = useState<PatientTreffer[]>([]);
  const [suchLoading, setSuchLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientTreffer | null>(null);
  const suchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Freitext (kein Konto)
  const [freitextName, setFreitextName] = useState("");
  const [freitextTelefon, setFreitextTelefon] = useState("");

  const laden = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/akutslots-live");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Fehler beim Laden");
      }
      const json: ApiResponse = await res.json();
      setSlots(json.slots);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    laden();
  }, [laden]);

  // Patienten-Suche mit Debounce
  useEffect(() => {
    if (suchTimeoutRef.current) clearTimeout(suchTimeoutRef.current);

    if (suchQuery.length < 2) {
      setSuchErgebnis([]);
      return;
    }

    suchTimeoutRef.current = setTimeout(async () => {
      setSuchLoading(true);
      try {
        const res = await fetch(`/api/patienten-suche?q=${encodeURIComponent(suchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSuchErgebnis(data.patienten);
        }
      } catch {
        // silently ignore
      } finally {
        setSuchLoading(false);
      }
    }, 300);

    return () => {
      if (suchTimeoutRef.current) clearTimeout(suchTimeoutRef.current);
    };
  }, [suchQuery]);

  const handleBuchungOeffnen = (slotId: string) => {
    setBuchFormSlot(slotId);
    setError(null);
    setSuccessMessage(null);
    setSuchQuery("");
    setSuchErgebnis([]);
    setSelectedPatient(null);
    setFreitextName("");
    setFreitextTelefon("");
  };

  const handleBuchungSchliessen = () => {
    setBuchFormSlot(null);
  };

  const handlePatientAuswaehlen = (p: PatientTreffer) => {
    setSelectedPatient(p);
    setSuchQuery(p.name);
    setSuchErgebnis([]);
  };

  const handlePatientAbwaehlen = () => {
    setSelectedPatient(null);
    setSuchQuery("");
    setSuchErgebnis([]);
  };

  const handleBuchen = async () => {
    if (!buchFormSlot) return;

    setBuchSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const csrfRes = await fetch("/api/csrf");
      const csrfData = await csrfRes.json();

      const body: Record<string, unknown> = { slotId: buchFormSlot };

      if (selectedPatient) {
        body.patientId = selectedPatient.id;
      } else if (freitextName.trim()) {
        body.patientNameFreitext = freitextName.trim();
        body.telefonFreitext = freitextTelefon.trim();
      } else {
        throw new Error("Bitte Patienten auswaehlen oder Name/Telefon eingeben.");
      }

      const res = await fetch("/api/akutslots-live/buchen", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfData.token,
        },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Fehler bei Buchung");
      }

      setSuccessMessage(json.message || "Akutslot erfolgreich gebucht.");
      setBuchFormSlot(null);
      // Liste aktualisieren – der gebuchte Slot verschwindet
      await laden();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setBuchSubmitting(false);
    }
  };

  return (
    <div className="page">
      <section className="intro">
        <p className="eyebrow">Praxis Demir &amp; Kollegen</p>
        <h1>Freie Akutslots (Live)</h1>
        <p>
          Aktuell freie Akutslots für heute &mdash; aktualisiert beim Seitenaufruf.
          MFAs können Slots telefonisch vergeben.
        </p>
      </section>

      {error && (
        <section className="panel" style={{ marginBottom: 20 }}>
          <p style={{ color: "#dc2626" }}>{error}</p>
        </section>
      )}

      {successMessage && (
        <section className="panel" style={{ marginBottom: 20 }}>
          <p style={{ color: "#16a34a" }}>{successMessage}</p>
        </section>
      )}

      {/* Tabelle mit Buchungs-Button */}
      <section className="panel">
        {loading ? (
          <p className="empty-state">Lade freie Akutslots ...</p>
        ) : slots.length === 0 ? (
          <>
            <p className="empty-state">Keine freien Akutslots für heute.</p>
            <p style={{ marginTop: 12, color: "#555", fontSize: "0.9rem" }}>
              Entweder wurden noch keine Akutslots freigegeben, oder alle sind bereits belegt.
              MFAs können unter <a href="/praxis/akutslots">Akutslots verwalten</a> neue Slots freigeben.
            </p>
          </>
        ) : (
          <>
            <p style={{ marginBottom: 12, color: "#555" }}>
              <strong>{slots.length}</strong> freie Akutslot(s) &middot; Diensthabend: <strong>{slots[0].arzt.name}</strong>
            </p>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Zeit</th>
                    <th>Arzt / Ärztin</th>
                    <th>Aktion</th>
                  </tr>
                </thead>
                <tbody>
                  {slots.map((slot) => (
                    <tr key={slot.id}>
                      <td>
                        <strong>{formatZeit(slot.startzeit)}</strong>
                        {" \u2013 "}
                        {formatZeit(slot.endzeit)}
                      </td>
                      <td>{slot.arzt.name}</td>
                      <td>
                        <button
                          onClick={() => handleBuchungOeffnen(slot.id)}
                          className="btn btn-primary"
                          style={{ padding: "4px 12px", fontSize: "0.85rem" }}
                        >
                          Telefonisch buchen
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* Buchungs-Overlay / Inline-Formular */}
      {buchFormSlot && (
        <section className="panel" style={{ marginTop: 20, border: "2px solid #2563eb" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ margin: 0 }}>Telefonische Buchung</h2>
            <button
              onClick={handleBuchungSchliessen}
              className="btn"
              style={{ padding: "4px 12px", fontSize: "0.85rem" }}
            >
              Schliessen
            </button>
          </div>

          {/* Schritt 1: Patient auswählen oder Freitext */}
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: "1rem", marginBottom: 8 }}>Patient:in auswählen</h3>

            {/* Suche nach bestehendem Patienten */}
            <label htmlFor="patient-suche" style={{ fontWeight: 600, display: "block", marginBottom: 4 }}>
              Suche nach Name oder Patientennummer:
            </label>
            <input
              id="patient-suche"
              type="text"
              value={suchQuery}
              onChange={(e) => {
                setSuchQuery(e.target.value);
                if (selectedPatient) setSelectedPatient(null);
              }}
              placeholder="Mind. 2 Zeichen ..."
              style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc", width: "100%", maxWidth: 400, marginBottom: 8 }}
              disabled={!!selectedPatient}
            />
            {suchLoading && <p style={{ fontSize: "0.85rem", color: "#555" }}>Suche läuft ...</p>}

            {suchErgebnis.length > 0 && !selectedPatient && (
              <ul style={{ listStyle: "none", padding: 0, margin: "4px 0 12px 0", border: "1px solid #ccc", borderRadius: 6, maxHeight: 200, overflowY: "auto" }}>
                {suchErgebnis.map((p) => (
                  <li
                    key={p.id}
                    onClick={() => handlePatientAuswaehlen(p)}
                    style={{
                      padding: "8px 12px",
                      cursor: "pointer",
                      borderBottom: "1px solid #eee",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f4ff")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <span>
                      <strong>{p.name}</strong>
                      <span style={{ color: "#555", marginLeft: 8, fontSize: "0.85rem" }}>
                        ({p.internePatientennummer})
                      </span>
                    </span>
                    <span style={{ color: "#777", fontSize: "0.85rem" }}>
                      {formatDatumKurz(p.geburtsdatum)}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {selectedPatient && (
              <div style={{ padding: "8px 12px", background: "#f0fdf4", borderRadius: 6, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>
                  <strong>{selectedPatient.name}</strong>
                  <span style={{ color: "#555", marginLeft: 8, fontSize: "0.85rem" }}>
                    ({selectedPatient.internePatientennummer})
                  </span>
                </span>
                <button
                  onClick={handlePatientAbwaehlen}
                  className="btn"
                  style={{ padding: "2px 8px", fontSize: "0.8rem" }}
                >
                  Entfernen
                </button>
              </div>
            )}

            <details style={{ marginTop: 12 }}>
              <summary style={{ cursor: "pointer", fontWeight: 600, color: "#555" }}>
                Oder Gast-Patient (kein Konto) erfassen
              </summary>
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8, maxWidth: 400 }}>
                <div>
                  <label htmlFor="freitext-name" style={{ display: "block", fontWeight: 600, marginBottom: 2, fontSize: "0.9rem" }}>
                    Name:
                  </label>
                  <input
                    id="freitext-name"
                    type="text"
                    value={freitextName}
                    onChange={(e) => setFreitextName(e.target.value)}
                    placeholder="z.B. Mustermann, Max"
                    style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc", width: "100%" }}
                    disabled={!!selectedPatient}
                  />
                </div>
                <div>
                  <label htmlFor="freitext-telefon" style={{ display: "block", fontWeight: 600, marginBottom: 2, fontSize: "0.9rem" }}>
                    Telefon:
                  </label>
                  <input
                    id="freitext-telefon"
                    type="text"
                    value={freitextTelefon}
                    onChange={(e) => setFreitextTelefon(e.target.value)}
                    placeholder="z.B. 030 12345678"
                    style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc", width: "100%" }}
                    disabled={!!selectedPatient}
                  />
                </div>
              </div>
            </details>
          </div>

          {/* Buchungs-Button */}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button
              onClick={handleBuchen}
              disabled={
                buchSubmitting ||
                (!selectedPatient && !freitextName.trim())
              }
              className="btn btn-primary"
            >
              {buchSubmitting
                ? "Wird gebucht ..."
                : selectedPatient
                ? "Buchung für " + selectedPatient.name + " bestätigen"
                : "Gast-Buchung bestätigen"}
            </button>
          </div>
        </section>
      )}

      <section className="panel" style={{ marginTop: 20 }}>
        <h2>Info</h2>
        <ul style={{ fontSize: "0.9em", color: "#555" }}>
          <li>Akutslots sind nicht online buchbar &ndash; Vergabe erfolgt telefonisch durch MFAs.</li>
          <li>Pro Tag werden 8 Akutslots freigegeben (4 vormittags, 4 nachmittags).</li>
          <li>Bei Arzt-Ausfall werden Akutslots gesperrt (siehe F-BETR-4).</li>
          <li><strong>Doppelbuchungsschutz:</strong> Ein Slot wird atomar gesperrt &ndash; bei gleichzeitiger Buchung durch zwei MFAs erhält nur die erste den Slot.</li>
        </ul>
      </section>
    </div>
  );
}
