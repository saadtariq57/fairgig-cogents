import ServiceStatus from "./_components/ServiceStatus";

const services = [
  { name: "Auth",        port: 8001, url: process.env.NEXT_PUBLIC_AUTH_URL },
  { name: "Earnings",    port: 8002, url: process.env.NEXT_PUBLIC_EARNINGS_URL },
  { name: "Anomaly",     port: 8003, url: process.env.NEXT_PUBLIC_ANOMALY_URL },
  { name: "Grievance",   port: 8004, url: process.env.NEXT_PUBLIC_GRIEVANCE_URL },
  { name: "Analytics",   port: 8005, url: process.env.NEXT_PUBLIC_ANALYTICS_URL },
  { name: "Certificate", port: 8006, url: process.env.NEXT_PUBLIC_CERTIFICATE_URL },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-16">
      <header className="space-y-2">
        <h1 className="text-4xl font-semibold tracking-tight">FairGig</h1>
        <p className="text-sm text-neutral-500">
          Gig-worker earnings transparency platform. 6 backend services + this frontend.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wider text-neutral-500">
          Service health
        </h2>
        <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
          {services.map((s) => (
            <ServiceStatus key={s.port} name={s.name} port={s.port} url={s.url} />
          ))}
        </ul>
      </section>
    </main>
  );
}
