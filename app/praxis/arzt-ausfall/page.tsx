'use client';

import { useCallback, useEffect, useState } from 'react';

type Arzt = { id: string; name: string; fachrichtung: string };
type Patient = { id: string; name: string };
type TerminSlot = {
  id: string;
  datum: string;
  startzeit: string;
  endzeit: string;
  status: string;
  slotArt: string;
  buchungsquelle: string | null;
  patient: Patient | null;
  terminTyp: { bezeichnung: string };
};

type AusfallResponse = {
  akutSlots: TerminSlot[];
  geplanteTermine: TerminSlot[];
  patienten: Patient[];
  arzt: Arzt;
  datumVon: string;
  datumBis: string;
};

type AusfallResult = {
  success: boolean;
  akutSlotsGesperrt: number;
  termineMarkiert: number;
  sperrzeitId: string;
  message: string;
};

function formatZeit(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

function formatDatum(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('de-DE', {
    weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit',
  });
}

function statusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    frei: 'frei-badge',
    gebucht: 'gebucht-badge',
    abgesagt: 'abgesagt-badge',
    gesperrt: 'gesperrt-badge',
    noShow: 'abgesagt-badge',
    umbuchungErforderlich: 'gesperrt-badge',
  };
  return map[status] || 'frei-badge';
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    frei: 'Frei',
    gebucht: 'Gebucht',
    abgesagt: 'Abgesagt',
    gesperrt: 'Gesperrt',
    noShow: 'No-Show',
    umbuchungErforderlich: 'Umbuchung erforderlich',
  };
  return map[status] || status;
}

export default function ArztAusfallPage() {
  const [aerzte, setAerzte] = useState<Arzt[]>([]);
  const [selectedArztId, setSelectedArztId] = useState('');
  const [von, setVon] = useState('');
  const [bis, setBis] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AusfallResponse | null>(null);
  const [submitResult, setSubmitResult] = useState<AusfallResult | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // Datum initialisieren: heute
  useEffect(() => {
    const heute = new Date();
    const y = heute.getFullYear();
    const m = String(heute.getMonth() + 1).padStart(2, '0');
    const d = String(heute.getDate()).padStart(2, '0');
    setVon(y + '-' + m + '-' + d);
    setBis(y + '-' + m + '-' + d);
  }, []);

  // Ärzt:innen laden
  useEffect(() => {
    fetch('/api/aerzte')
      .then((r) => r.json())
      .then((data: { aerzte: Arzt[] }) => setAerzte(data.aerzte || []))
      .catch(() => {});
  }, []);

  const vorschauLaden = useCallback(async () => {
    if (!selectedArztId || !von || !bis) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSubmitResult(null);
    setShowConfirm(false);

    try {
      const params = new URLSearchParams({ arztId: selectedArztId, von, bis });
      const res = await fetch('/api/arzt-ausfall?' + params.toString());
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Fehler beim Laden');
      }
      const json: AusfallResponse = await res.json();
      setResult(json);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  }, [selectedArztId, von, bis]);

  const ausfallAusloesen = async () => {
    if (!selectedArztId || !von || !bis) return;
    setSubmitting(true);
    setError(null);
    setSubmitResult(null);

    try {
      const csrfRes = await fetch('/api/csrf');
      const csrfData = await csrfRes.json();

      const res = await fetch('/api/arzt-ausfall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfData.token },
        body: JSON.stringify({ arztId: selectedArztId, von, bis }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Fehler bei der Ausfall-Erfassung');

      setSubmitResult(body);
      setShowConfirm(false);
      // Vorschau nach Ausführung neu laden
      await vorschauLaden();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler');
    } finally {
      setSubmitting(false);
    }
  };

  const hatBetroffene = result
    ? result.akutSlots.length > 0 || result.geplanteTermine.length > 0
    : false;

  return (
    <div className="page">
      <section className="intro">
        <p className="eyebrow">Praxis Demir &amp; Kollegen</p>
        <h1>Arzt-Ausfall</h1>
        <p>
          Bei kurzfristigem Arzt-Ausfall werden Akutslots gesperrt und planbare
          Termine als umbuchungErforderlich markiert. Die MFAs vergeben die
          Termine telefonisch neu.
        </p>
        <p>
          <a href="/praxis">&larr; Zurück zur Praxis-Übersicht</a>
        </p>
      </section>

      {/* Fehler */}
      {error && <div className="alert alert-error">{error}</div>}
      {submitResult && (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          {submitResult.message}
        </div>
      )}

      {/* Auswahlbereich */}
      <section className="panel" style={{ marginBottom: 24 }}>
        <h2>Ausfall erfassen</h2>
        <div
          style={{
            display: 'flex',
            gap: 16,
            alignItems: 'flex-end',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <label
              htmlFor="arzt-ausfall-select"
              style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}
            >
              Arzt / Ärztin
            </label>
            <select
              id="arzt-ausfall-select"
              value={selectedArztId}
              onChange={(e) => setSelectedArztId(e.target.value)}
              className="input"
              style={{ padding: '6px 10px', minWidth: 220 }}
            >
              <option value="">Bitte wählen</option>
              {aerzte.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.fachrichtung})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="ausfall-von"
              style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}
            >
              Von
            </label>
            <input
              id="ausfall-von"
              type="date"
              value={von}
              onChange={(e) => setVon(e.target.value)}
              className="input"
              style={{ padding: '6px 10px' }}
            />
          </div>
          <div>
            <label
              htmlFor="ausfall-bis"
              style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}
            >
              Bis
            </label>
            <input
              id="ausfall-bis"
              type="date"
              value={bis}
              onChange={(e) => setBis(e.target.value)}
              className="input"
              style={{ padding: '6px 10px' }}
            />
          </div>
          <button
            onClick={vorschauLaden}
            disabled={loading || !selectedArztId || !von || !bis}
            className="btn btn-primary"
            style={{ padding: '8px 20px' }}
          >
            {loading ? 'Lade ...' : 'Vorschau anzeigen'}
          </button>
        </div>
      </section>

      {/* Ergebnis-Vorschau */}
      {result && (
        <>
          <section className="panel" style={{ marginBottom: 24 }}>
            <h2>
              Betroffene Termine: {result.arzt.name}
              <span style={{ fontWeight: 'normal', fontSize: '0.8em', color: '#666', marginLeft: 12 }}>
                {formatDatum(result.datumVon)} &ndash; {formatDatum(result.datumBis)}
              </span>
            </h2>

            {!hatBetroffene ? (
              <p className="empty-state">
                Keine betroffenen Termine für diesen Zeitraum.
              </p>
            ) : (
              <>
                {/* Akutslots */}
                {result.akutSlots.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <h3>
                      Akutslots ({result.akutSlots.length})
                      <span style={{ fontWeight: 'normal', fontSize: '0.85em', color: '#888', marginLeft: 8 }}>
                        werden gesperrt
                      </span>
                    </h3>
                    <div className="table-wrapper">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Datum</th>
                            <th>Zeit</th>
                            <th>Status</th>
                            <th>Patient:in</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.akutSlots.map((s) => (
                            <tr key={s.id}>
                              <td>{formatDatum(s.datum)}</td>
                              <td>
                                {formatZeit(s.startzeit)} &ndash; {formatZeit(s.endzeit)}
                              </td>
                              <td>
                                <span className={`badge ${statusBadgeClass(s.status)}`}>
                                  {statusLabel(s.status)}
                                </span>
                              </td>
                              <td>
                                {s.patient ? (
                                  <strong>{s.patient.name}</strong>
                                ) : (
                                  <span style={{ color: '#999' }}>&mdash;</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Geplante Termine */}
                {result.geplanteTermine.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <h3>
                      Geplante Termine ({result.geplanteTermine.length})
                      <span style={{ fontWeight: 'normal', fontSize: '0.85em', color: '#888', marginLeft: 8 }}>
                        werden als umbuchungErforderlich markiert
                      </span>
                    </h3>
                    <div className="table-wrapper">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Datum</th>
                            <th>Zeit</th>
                            <th>Patient:in</th>
                            <th>Termintyp</th>
                            <th>Buchungsweg</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.geplanteTermine.map((s) => (
                            <tr key={s.id}>
                              <td>{formatDatum(s.datum)}</td>
                              <td>
                                {formatZeit(s.startzeit)} &ndash; {formatZeit(s.endzeit)}
                              </td>
                              <td>
                                {s.patient ? (
                                  <strong>{s.patient.name}</strong>
                                ) : (
                                  <span style={{ color: '#999' }}>&mdash;</span>
                                )}
                              </td>
                              <td>
                                <span className="badge frei-badge">
                                  {s.terminTyp.bezeichnung}
                                </span>
                              </td>
                              <td>{s.buchungsquelle || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Betroffene Patient:innen */}
                {result.patienten.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <h3>
                      Betroffene Patient:innen ({result.patienten.length})
                      <span style={{ fontWeight: 'normal', fontSize: '0.85em', color: '#888', marginLeft: 8 }}>
                        MFAs vergeben Termine telefonisch neu
                      </span>
                    </h3>
                    <div className="table-wrapper">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Patient:in</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.patienten.map((p) => (
                            <tr key={p.id}>
                              <td>
                                <strong>{p.name}</strong>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>

          {/* Auslöse-Button */}
          {hatBetroffene && !showConfirm && (
            <section className="panel" style={{ marginBottom: 24 }}>
              <p style={{ color: '#b91c1c', marginBottom: 12, fontWeight: 600 }}>
                ? Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
              <button
                onClick={() => setShowConfirm(true)}
                className="btn"
                style={{
                  background: '#b91c1c',
                  color: 'white',
                  padding: '10px 24px',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Ausfall jetzt erfassen
              </button>
            </section>
          )}

          {/* Bestätigung */}
          {showConfirm && (
            <section
              className="panel"
              style={{ marginBottom: 24, border: '2px solid #b91c1c' }}
            >
              <h2 style={{ color: '#b91c1c' }}>Bestätigung erforderlich</h2>
              <p>
                Sind Sie sicher, dass Sie den Ausfall von{' '}
                <strong>{result.arzt.name}</strong> für den Zeitraum{' '}
                {formatDatum(result.datumVon)} bis {formatDatum(result.datumBis)}{' '}
                erfassen möchten?
              </p>
              <ul style={{ marginBottom: 12 }}>
                <li>
                  <strong>{result.akutSlots.length}</strong> Akutslot(s)
                  werden gesperrt
                </li>
                <li>
                  <strong>{result.geplanteTermine.length}</strong> Termin(e)
                  werden als umbuchungErforderlich markiert
                </li>
                <li>
                  <strong>{result.patienten.length}</strong> Patient:in(nen)
                  sind betroffen (telefonische Neuvergabe durch MFAs)
                </li>
              </ul>
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={ausfallAusloesen}
                  disabled={submitting}
                  className="btn"
                  style={{
                    background: '#b91c1c',
                    color: 'white',
                    padding: '10px 24px',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {submitting ? 'Wird ausgeführt ...' : 'Ja, Ausfall erfassen'}
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="btn btn-secondary"
                  style={{ padding: '10px 24px' }}
                >
                  Abbrechen
                </button>
              </div>
            </section>
          )}
        </>
      )}

      {/* Hinweis zur Spec */}
      <section className="panel" style={{ marginTop: 24 }}>
        <h2>Hinweise</h2>
        <ul style={{ fontSize: '0.9em', color: '#555' }}>
          <li>
            Gemäß Spec §15 werden Termine nicht automatisch umgebucht, sondern
            durch MFAs telefonisch neu vergeben.
          </li>
          <li>
            Akutslots werden auf "gesperrt" gesetzt, damit keine versehentliche
            Vergabe erfolgt.
          </li>
          <li>
            Ein Sperrzeit-Eintrag mit Grund "Krankheit" wird automatisch
            angelegt.
          </li>
        </ul>
      </section>
    </div>
  );
}
