"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    // CSRF-Token holen
    let csrfToken = "";
    try {
      const csrfRes = await fetch("/api/csrf");
      const csrfData = await csrfRes.json();
      csrfToken = csrfData.token;
    } catch {}
    await fetch("/api/logout", { method: "POST", headers: { "x-csrf-token": csrfToken } });
    router.push("/login");
  }

  return (
    <button className="btn-logout" onClick={handleLogout} disabled={loading}>
      {loading ? "Wird abgemeldet …" : "Abmelden"}
    </button>
  );
}
