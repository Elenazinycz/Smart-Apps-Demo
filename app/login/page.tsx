"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [benutzername, setBenutzername] = useState("");
  const [passwort, setPasswort] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // CSRF-Token holen
    let csrfToken = "";
    try {
      const csrfRes = await fetch("/api/csrf");
      const csrfData = await csrfRes.json();
      csrfToken = csrfData.token;
    } catch {}

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
        body: JSON.stringify({ benutzername, passwort }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login fehlgeschlagen");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Verbindungsfehler");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={handleSubmit}>
        <p className="eyebrow">Praxis Demir &amp; Kollegen</p>
        <h1>Anmelden</h1>

        {error && <p className="error">{error}</p>}

        <label>
          Benutzername
          <input
            type="text"
            value={benutzername}
            onChange={(e) => setBenutzername(e.target.value)}
            placeholder="z.B. admin@praxis-demir.de oder erika.mustermann"
            required
          />
        </label>

        <label>
          Passwort
          <input
            type="password"
            value={passwort}
            onChange={(e) => setPasswort(e.target.value)}
            placeholder="Beliebiges Passwort (Mock)"
            required
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Wird angemeldet …" : "Anmelden"}
        </button>

        <details className="login-hints">
          <summary>Test-Zugänge (Mock)</summary>
          <ul>
            <li><strong>Admin:</strong> admin@praxis-demir.de</li>
            <li><strong>MFA:</strong> s.mueller@praxis-demir.de</li>
            <li><strong>Patient:</strong> erika.mustermann</li>
          </ul>
        </details>
      </form>
    </div>
  );
}

