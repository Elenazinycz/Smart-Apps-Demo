const coreFeatures = [
  "Online-Buchung für Stammpatient:innen",
  "Stornierung und Umbuchung bis 24 Stunden vorher",
  "Pflegbare Sprechzeiten, Sperrzeiten und Termintypen",
  "Akutslot- und Arzt-Ausfall-Unterstützung für MFAs",
];

export default function Home() {
  return (
    <main className="page">
      <section className="intro">
        <p className="eyebrow">Praxis Demir &amp; Kollegen</p>
        <h1>Praxis-Terminsoftware für Demir & Kollegen</h1>
        <p>
          Demo-Anwendung für verbindliche Terminbuchung, Umbuchung,
          Stornierung und zentrale Praxis-Workflows. Das PVS bleibt führend.
        </p>
      </section>

      <section className="panel" aria-labelledby="scope-heading">
        <h2 id="scope-heading">Kernumfang</h2>
        <ul>
          {coreFeatures.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}

