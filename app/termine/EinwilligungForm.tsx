'use client';

import { useState } from 'react';

interface EinwilligungProps {
  einwilligungEmail: boolean;
  einwilligungSms: boolean;
  email: string | null;
  telefonnummer: string | null;
}

export default function EinwilligungForm({ einwilligungEmail, einwilligungSms, email, telefonnummer }: EinwilligungProps) {
  const [emailOpt, setEmailOpt] = useState(einwilligungEmail);
  const [smsOpt, setSmsOpt] = useState(einwilligungSms);
  const [saving, setSaving] = useState(false);
  const [meldung, setMeldung] = useState<{ typ: 'erfolg' | 'fehler'; text: string } | null>(null);

  async function handleSave() {
    setSaving(true);
    setMeldung(null);

    try {
      const res = await fetch('/api/patient/einwilligung', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': document.cookie.replace(/.*csrf-token=([^;]*).*/, '') },
        body: JSON.stringify({ einwilligungEmail: emailOpt, einwilligungSms: smsOpt }),
      });
      const data = await res.json();
      if (res.ok) {
        setMeldung({ typ: 'erfolg', text: 'Einwilligungen gespeichert.' });
      } else {
        setMeldung({ typ: 'fehler', text: data.error ?? 'Fehler beim Speichern.' });
      }
    } catch {
      setMeldung({ typ: 'fehler', text: 'Netzwerkfehler.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={emailOpt} onChange={(e) => setEmailOpt(e.target.checked)} disabled={!email} />
          <span>
            <strong>E-Mail-Benachrichtigungen</strong>
            {email ? <span style={{ color: '#666', marginLeft: 4 }}>({email})</span> : <span style={{ color: '#999', marginLeft: 4 }}>(keine E-Mail hinterlegt)</span>}
          </span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={smsOpt} onChange={(e) => setSmsOpt(e.target.checked)} disabled={!telefonnummer} />
          <span>
            <strong>SMS-Benachrichtigungen</strong>
            {telefonnummer ? <span style={{ color: '#666', marginLeft: 4 }}>({telefonnummer})</span> : <span style={{ color: '#999', marginLeft: 4 }}>(keine Telefonnummer hinterlegt)</span>}
          </span>
        </label>
        <div>
          <button type="submit" disabled={saving} className="button">
            {saving ? 'Speichern...' : 'Einwilligungen speichern'}
          </button>
        </div>
      </form>
      {meldung && (
        <p style={{ color: meldung.typ === 'erfolg' ? '#2e7d32' : '#c62828', marginTop: 8 }}>
          {meldung.text}
        </p>
      )}
    </div>
  );
}
