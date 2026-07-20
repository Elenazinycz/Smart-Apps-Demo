"use client";

import { useCallback, useEffect, useState } from "react";

type TagesSlot = {
  id: string;
  datum: string;
  startzeit: string;
  endzeit: string;
  status: string;
  buchungsquelle: string | null;
  patient: { id: string; name: string } | null;
  arzt: { name: string };
  terminTyp: { bezeichnung: string };
};

type ApiResponse = {
  slots: TagesSlot[];
  datum: string;
};

type ArztOption = {
  id: string;
  name: string;
};

function formatZeit(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

function buchungswegLabel(quelle: string | null): string {
  if (quelle === "online") return "Online";
  if (quelle === "telefonisch") return "Telefonisch";
  if (quelle === "intern") return "Intern";
  return "Unbekannt";
}

export default function TageslistePage() {
  const [slots, setSlots] = useState<TagesSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [datumStr, setDatumStr] = useState("");
  const [selectedDatum, setSelectedDatum] = useState("");
  const [selectedArztId, setSelectedArztId] = useState("");
  const [aerzte, setAerzte] = useState<ArztOption[]>([]);

  // Datum initialisieren: heute in lokaler Zeit (YYYY-MM-DD)
  useEffect(() => {
    const heute = new Date();
    const y = heute.getFullYear();
    const m = String(heute.getMonth() + 1).padStart(2, "0");
    const d = String(heute.getDate()).padStart(2, "0");
    setSelectedDatum(y + "-" + m + "-" + d);
  }, []);

  // Aerzte laden
  useEffect(() => {
    fetch("/api/aerzte")
      .then((res) => res.json())
      .then((data: { aerzte: ArztOption[] }) => {
        setAerzte(data.aerzte || []);
      })
      .catch(() => {});
  }, []);

  const laden = useCallback(
    async (datum: string, arztId: string) => {
      if (!datum) return;
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ datum: datum });
        if (arztId) params.set("arztId", arztId);

        const res = await fetch("/api/tagesliste?" + params.toString());
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Fehler beim Laden der Tagesliste");
        }

        const json: ApiResponse = await res.json();
        setSlots(json.slots);
        setDatumStr(json.datum);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Unbekannter Fehler");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (selectedDatum) {
      laden(selectedDatum, selectedArztId);
    }
  }, [selectedDatum, selectedArztId, laden]);

  const datumAnzeige = datumStr
    ? new Date(datumStr + "T00:00:00").toLocaleDateString("de-DE", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <div className="page">
      <section className="intro">
        <p className="eyebrow">Praxis Demir &amp; Kollegen</p>
        <h1>Tagesliste</h1>
        <p>
          Alle gebuchten Termine f&uuml;r ein Datum &mdash; mit Uhrzeit,
          Patient:in, Arzt, Termintyp und Buchungsweg.
        </p>
      </section>

      {/* Filter */}
      <section className="panel" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div>
            <label
              htmlFor="datum-input"
              style={{ display: "block", fontWeight: 600, marginBottom: 4, fontSize: "0.9rem" }}
            >
              Datum
            </label>
            <input
              id="datum-input"
              type="date"
              value={selectedDatum}
              onChange={(e) => setSelectedDatum(e.target.value)}
              className="input"
              style={{ padding: "6px 10px", fontSize: "0.9rem" }}
            />
          </div>

          <div>
            <label
              htmlFor="arzt-filter"
              style={{ display: "block", fontWeight: 600, marginBottom: 4, fontSize: "0.9rem" }}
            >
              Arzt / &Auml;rztin
            </label>
            <select
              id="arzt-filter"
              value={selectedArztId}
              onChange={(e) => setSelectedArztId(e.target.value)}
              className="input"
              style={{ padding: "6px 10px", fontSize: "0.9rem", minWidth: 200 }}
            >
              <option value="">Alle &Auml;rzt:innen</option>
              {aerzte.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              const heute = new Date();
              const y = heute.getFullYear();
              const m = String(heute.getMonth() + 1).padStart(2, "0");
              const d = String(heute.getDate()).padStart(2, "0");
              setSelectedDatum(y + "-" + m + "-" + d);
            }}
            className="btn btn-secondary"
            style={{ padding: "6px 14px", fontSize: "0.9rem" }}
          >
            Heute
          </button>
        </div>
      </section>

      {/* Fehler */}
      {error && (
        <section className="panel">
          <p style={{ color: "#dc2626" }}>{error}</p>
        </section>
      )}

      {/* Ladezustand */}
      {loading && (
        <section className="panel">
          <p className="empty-state">Lade Tagesliste ...</p>
        </section>
      )}

      {/* Tabelle */}
      {!loading && !error && (
        <section className="panel">
          <h2>{datumAnzeige}</h2>
          <p style={{ marginBottom: 12, color: "#555" }}>
            {slots.length === 0
              ? "Keine gebuchten Termine f&uuml;r dieses Datum."
              : slots.length + " gebuchte(r) Termin(e)"}
          </p>

          {slots.length > 0 && (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Uhrzeit</th>
                    <th>Patient:in</th>
                    <th>Arzt / &Auml;rztin</th>
                    <th>Termintyp</th>
                    <th>Buchungsweg</th>
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
                      <td>
                        {slot.patient ? (
                          <strong>{slot.patient.name}</strong>
                        ) : (
                          <span style={{ color: "#999" }}>&mdash;</span>
                        )}
                      </td>
                      <td>{slot.arzt.name}</td>
                      <td>
                        <span className="badge frei-badge">
                          {slot.terminTyp.bezeichnung}
                        </span>
                      </td>
                      <td>
                        <span
                          className={"badge " + (
                            slot.buchungsquelle === "online"
                              ? "gebucht-badge"
                              : slot.buchungsquelle === "telefonisch"
                              ? "frei-badge"
                              : "gesperrt-badge"
                          )}
                        >
                          {buchungswegLabel(slot.buchungsquelle)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Hinweis zur Arzt-Tagesliste */}
      <section className="panel" style={{ marginTop: 20 }}>
        <h2>Arzt-Filter</h2>
        <p style={{ fontSize: "0.9em", color: "#555" }}>
          &Auml;rzt:innen sehen &uuml;ber das Dropdown &bdquo;Arzt / &Auml;rztin&ldquo;
          standardm&auml;&szlig;ig nur ihre eigenen Termine.
          Aktuell haben &Auml;rzte noch keinen eigenen Login (keine Rolle &bdquo;Arzt&ldquo;
          in PraxisNutzer). MFAs/Admins k&ouml;nnen den Filter nutzen, um die Ansicht
          pro Arzt einzuschr&auml;nken.
        </p>
      </section>
    </div>
  );
}

