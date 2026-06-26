import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  DoorOpen,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Oyesile Estate" },
      {
        name: "description",
        content:
          "The private resident and community officer app for Oyesile Estate.",
      },
      { property: "og:title", content: "Welcome to Oyesile Estate" },
      {
        property: "og:description",
        content:
          "Sign in to manage dues, visitors, announcements, complaints, security and community records.",
      },
    ],
  }),
  component: Landing,
});

const roleCards = [
  {
    icon: Users,
    title: "Community officers",
    desc: "Chairman, secretary, treasurer and approved committee members can manage estate operations.",
  },
  {
    icon: ShieldCheck,
    title: "Security leadership",
    desc: "The Chief Security Officer and security team can review visitors, incidents and gate activity.",
  },
  {
    icon: Building2,
    title: "Residents",
    desc: "Landlords, tenants and household members can see what applies to their homes.",
  },
];

const workflows = [
  { icon: CreditCard, label: "Reviewed dues", value: "Admin-approved invoices before residents pay" },
  { icon: CalendarClock, label: "Repeating payments", value: "Monthly, quarterly or yearly estate charges" },
  { icon: DoorOpen, label: "Visitor access", value: "Invite guests and help security verify entry" },
  { icon: CheckCircle2, label: "Shared records", value: "Complaints, announcements and receipts in one place" },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="relative flex min-h-screen overflow-hidden border-b border-border/60">
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
        <div className="absolute inset-y-0 right-0 hidden w-1/2 border-l border-border/50 bg-card/45 lg:block">
          <div className="grid h-full place-items-center p-12">
            <div className="w-full max-w-md rounded-md border border-border bg-background/80 p-5 shadow-sm backdrop-blur">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">Oyesile Estate</p>
                  <h2 className="font-display text-xl font-semibold">Today</h2>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-md bg-primary text-primary-foreground">
                  <Building2 className="h-5 w-5" />
                </div>
              </div>
              <div className="space-y-3">
                {workflows.map((item) => (
                  <div key={item.label} className="flex gap-3 rounded-md border border-border bg-card p-3">
                    <div className="grid h-9 w-9 flex-none place-items-center rounded-md bg-accent text-accent-foreground">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs leading-relaxed text-muted-foreground">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="container relative mx-auto flex max-w-6xl flex-1 flex-col px-6 py-6">
          <header className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
                <Building2 className="h-4 w-4" />
              </div>
              <span className="font-display text-lg font-semibold">Oyesile Estate</span>
            </Link>
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
          </header>

          <div className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1fr_0.8fr]">
            <div className="max-w-2xl">
              <p className="mb-4 text-sm font-medium text-primary">Private community app</p>
              <h1 className="font-display text-5xl font-semibold leading-tight md:text-6xl">
                Welcome to Oyesile Estate.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground md:text-lg">
                One place for residents and community officers to handle dues,
                visitors, announcements, complaints, security and estate records.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to="/auth">
                    Proceed to login <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/auth">Create account</Link>
                </Button>
              </div>
            </div>

            <div className="space-y-3 lg:hidden">
              {workflows.map((item) => (
                <div key={item.label} className="flex gap-3 rounded-md border border-border bg-card p-3">
                  <div className="grid h-9 w-9 flex-none place-items-center rounded-md bg-accent text-accent-foreground">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-6xl px-6 py-14">
        <div className="mb-8 max-w-2xl">
          <p className="mb-2 text-xs font-semibold uppercase text-primary">Built around the estate</p>
          <h2 className="font-display text-3xl font-semibold">Different people, correct access.</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            The app starts from Oyesile Estate, then assigns access by role so
            committee officers can review operations while residents see what
            matters to their household.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {roleCards.map((role) => (
            <div key={role.title} className="rounded-md border border-border bg-card p-5 shadow-sm">
              <div className="mb-4 grid h-10 w-10 place-items-center rounded-md bg-accent text-accent-foreground">
                <role.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-semibold">{role.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{role.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
