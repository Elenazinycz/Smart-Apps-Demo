"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <button className="btn-logout" onClick={handleLogout} disabled={loading}>
      {loading ? "Wird abgemeldet …" : "Abmelden"}
    </button>
  );
}
