import { createFileRoute } from "@tanstack/react-router";
import NavigationMenu from "@/components/navigation-menu";

const pillars = [
  "Block is the core unit with structured context + actions.",
  "Queue is a task ledger, not a passive notification center.",
  "Agent operates through block/runtime capabilities with auditability.",
  "Write and external side-effect actions are approval-gated by default.",
];

const p0Scope = [
  "Infinite canvas interactions and state persistence",
  "Terminal, Git, Notes/Analysis, and Agent Task blocks",
  "Queue panel with actionable task lifecycle",
  "Agent assignment, analysis generation, and approval workflow",
];

function SecondPage() {
  return (
    <>
      <NavigationMenu />
      <div className="flex h-full flex-col gap-3 rounded-md border bg-card p-4">
        <header>
          <h1 className="font-semibold text-2xl">CanvasOS PRD Snapshot</h1>
          <p className="text-muted-foreground text-sm">
            Agent-native OS / Infinite Canvas Desktop (MVP to Alpha)
          </p>
        </header>

        <section>
          <h2 className="mb-2 font-medium text-sm">Product pillars</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {pillars.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-2 font-medium text-sm">MVP must include</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {p0Scope.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

export const Route = createFileRoute("/second")({
  component: SecondPage,
});
