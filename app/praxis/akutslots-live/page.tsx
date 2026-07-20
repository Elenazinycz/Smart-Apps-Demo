"use client";

import { useCallback, useEffect, useState } from "react";

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

function formatZeit(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

export default function AkutslotsLivePage() {
  const [slots, setSlots] = useState<FreierAkutSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="page">
      <section className="intro">
        <p className="eyebrow">Smart-Apps-Demo</p>
        <h1>Freie Akutslots (Live)</h1>
        <p>
          Aktuell freie Akutslots f&uuml;r heute &mdash; aktualisiert beim Seitenaufruf.
        </p>
      </section>

      {error && (
        <section className="panel" style={{ marginBottom: 20 }}>
          <p style={{ color: "#dc2626" }}>{error}</p>
        </section>
      )}

      <section className="panel">
        {loading ? (
          <p className="empty-state">Lade freie Akutslots ...</p>
        ) : slots.length === 0 ? (
          <>
            <p className="empty-state">Keine freien Akutslots f&uuml;r heute.</p>
            <p style={{ marginTop: 12, color: "#555", fontSize: "0.9rem" }}>
              Entweder wurden noch keine Akutslots freigegeben, oder alle sind bereits belegt.
              MFAs k&ouml;nnen unter <a href="/praxis/akutslots">Akutslots verwalten</a> neue Slots freigeben.
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
                    <th>Arzt / &Auml;rztin</th>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <section className="panel" style={{ marginTop: 20 }}>
        <h2>Info</h2>
        <ul style={{ fontSize: "0.9em", color: "#555" }}>
          <li>Akutslots sind nicht online buchbar &ndash; Vergabe erfolgt telefonisch durch MFAs.</li>
          <li>Pro Tag werden 8 Akutslots freigegeben (4 vormittags, 4 nachmittags).</li>
          <li>Bei Arzt-Ausfall werden Akutslots gesperrt (siehe F-BETR-4).</li>
        </ul>
      </section>
    </div>
  );
}