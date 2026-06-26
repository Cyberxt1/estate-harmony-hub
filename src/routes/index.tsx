import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2,
  ShieldCheck,
  CreditCard,
  Users,
  QrCode,
  MessageSquareWarning,
  BellRing,
  FileText,
  BarChart3,
  ArrowRight,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EstateOS — The operating system for residential estates" },
      {
        name: "description",
        content:
          "EstateOS unifies residents, properties, visitors, payments, communication and security in one calm, modern platform.",
      },
      { property: "og:title", content: "EstateOS — Run your estate from one place" },
      {
        property: "og:description",
        content:
          "From QR-coded visitors to automated dues and incident reports — every workflow your estate runs, in one place.",
      },
    ],
  }),
  component: Landing,
});

const modules = [
  { icon: Users, title: "Residents & households", desc: "Profiles, household members, vehicles, emergency contacts, move-in/out." },
  { icon: Building2, title: "Properties", desc: "Houses, ownership, occupancy, meters, maintenance and documents." },
  { icon: QrCode, title: "Visitors & QR access", desc: "Pre-invite, scan at gate, vehicle access, full check-in history." },
  { icon: CreditCard, title: "Dues & payments", desc: "Recurring invoices, service charges, receipts and outstanding balances." },
  { icon: BellRing, title: "Communication", desc: "Announcements, broadcasts, emergency alerts, in-app notifications." },
  { icon: MessageSquareWarning, title: "Complaints", desc: "Submit, assign, track and resolve with a clear paper trail." },
  { icon: ShieldCheck, title: "Security", desc: "Incident reports, patrol logs, blacklist/watchlist, lost & found." },
  { icon: FileText, title: "Documents", desc: "Estate, property and resident files with scoped access." },
  { icon: BarChart3, title: "Reports", desc: "Revenue, occupancy, complaints and visitor analytics." },
];

const userTypes = [
  { name: "Estate admins", desc: "Chairman, manager, secretary, treasurer, committee." },
  { name: "Security", desc: "Gate, patrol and supervisors with their own dashboard." },
  { name: "Residents", desc: "Owners and tenants with household, vehicles and dues." },
  { name: "Household & staff", desc: "Family members, drivers, housekeepers, gardeners." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
              <Building2 className="h-4 w-4" />
            </div>
            <span className="font-display text-lg font-semibold">EstateOS</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#modules" className="hover:text-foreground">Modules</a>
            <a href="#who" className="hover:text-foreground">Who it's for</a>
            <a href="#flows" className="hover:text-foreground">Workflows</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/auth">
                Get started <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section
        className="relative overflow-hidden border-b border-border/60"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="container mx-auto max-w-6xl px-6 py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              The calm operating system for residential estates
            </div>
            <h1 className="font-display text-5xl font-semibold tracking-tight text-foreground md:text-6xl">
              Run your estate from one place.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Residents, visitors, dues, security and communication — unified in a
              modern platform your committee, residents and security team actually
              enjoy using.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link to="/auth">
                  Start free <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#modules">Explore modules</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Modules grid */}
      <section id="modules" className="container mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
            Everything your estate needs
          </p>
          <h2 className="font-display text-3xl font-semibold md:text-4xl">
            Nine modules. One quiet platform.
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m) => (
            <div
              key={m.title}
              className="group rounded-2xl border border-border bg-card p-6 transition hover:border-primary/30"
              style={{ boxShadow: "var(--shadow-soft)" }}
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <m.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-1 text-base font-semibold">{m.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Who */}
      <section id="who" className="border-y border-border/60 bg-secondary/40">
        <div className="container mx-auto max-w-6xl px-6 py-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
                Built for every role
              </p>
              <h2 className="font-display text-3xl font-semibold md:text-4xl">
                One platform, tailored dashboards.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Admins, security and residents each get the tools they need —
                without seeing the noise they don't.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {userTypes.map((u) => (
                <div key={u.name} className="rounded-xl border border-border bg-card p-5">
                  <div className="mb-2 flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="font-medium">{u.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{u.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Flows */}
      <section id="flows" className="container mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
            Workflows that just work
          </p>
          <h2 className="font-display text-3xl font-semibold md:text-4xl">
            From invite to invoice, fully tracked.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { title: "Visitor flow", steps: ["Resident invites", "QR generated", "Security verifies at gate", "Check-in & check-out"] },
            { title: "Billing flow", steps: ["Monthly invoice generated", "Resident notified", "Pays online", "Receipt + dashboard updated"] },
            { title: "Complaint flow", steps: ["Submitted by resident", "Assigned to committee", "In progress", "Resolved & confirmed"] },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-6">
              <h3 className="mb-4 font-display text-lg font-semibold">{f.title}</h3>
              <ol className="space-y-3">
                {f.steps.map((s, i) => (
                  <li key={s} className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                      {i + 1}
                    </span>
                    <span className="text-muted-foreground">{s}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto max-w-6xl px-6 pb-24">
        <div
          className="rounded-3xl border border-primary/20 bg-card p-12 text-center"
          style={{ boxShadow: "var(--shadow-lift)" }}
        >
          <h2 className="font-display text-3xl font-semibold md:text-4xl">
            Bring your estate online today.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Sign up free, configure your estate, and invite your committee in
            minutes. No setup calls required.
          </p>
          <div className="mt-8">
            <Button asChild size="lg">
              <Link to="/auth">
                Create your estate <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60">
        <div className="container mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2">
            <div className="grid h-6 w-6 place-items-center rounded bg-primary text-primary-foreground">
              <Building2 className="h-3.5 w-3.5" />
            </div>
            <span className="font-display font-semibold text-foreground">EstateOS</span>
          </div>
          <p>© {new Date().getFullYear()} EstateOS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
