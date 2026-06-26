const coreFeatures = [
  "Online-Buchung fuer Stammpatient:innen",
  "Stornierung und Umbuchung bis 24 Stunden vorher",
  "Pflegbare Sprechzeiten, Sperrzeiten und Termintypen",
  "Akutslot- und Arzt-Ausfall-Unterstuetzung fuer MFAs",
];

export default function Home() {
  return (
    <main className="page">
      <section className="intro">
        <p className="eyebrow">Smart-Apps-Demo</p>
        <h1>Praxis-Terminsoftware fuer Demir & Kollegen</h1>
        <p>
          Demo-Anwendung fuer verbindliche Terminbuchung, Umbuchung,
          Stornierung und zentrale Praxis-Workflows. Das PVS bleibt fuehrend.
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
