// Planen til PR-en, satt sammen av svarene fra Neo (`konfig.mjs plan`): planen per fil fra `plan-set` og det
// sandkassen har uten fil fra `not-in-files`. Skriptet vurderer ingenting selv: hva som endres, og om det går, er
// Neo sitt svar. Før gjennomføringen sammenlignes en ny plan med den godkjente: samme handling og samme endringer
// for hver fil.

// Det som godkjennes: per fil handlingen og endringene. `planHash` er med, men sammenlignes ikke: den endres når
// sandkassen endres, også når planen er den samme.
export const summary = (plans) =>
  plans.map((p) => ({
    path: p.path,
    action: p.action,
    changes: p.changes ?? [],
    notRemoved: p.notRemoved ?? [],
    deferredSteps: p.deferredSteps ?? false,
    reasons: p.reasons ?? [],
    planHash: p.planHash ?? null,
  }));

const show = (v) => {
  const s = v === undefined ? "–" : JSON.stringify(v);
  return (s.length > 60 ? `${s.slice(0, 57)}…` : s).replaceAll("|", "\\|");
};

export function markdown({ plans, notInFiles }) {
  const s = summary(plans);
  const count = (a) => s.filter((p) => p.action === a).length;
  const out = [
    "# Planen mot sandkassen",
    "",
    `Neo har prøvd hver fil uten å lagre: ${count("create")} nye, ${count("update")} endret, ${count("unchanged")} uendret, ${count("rejected")} avvist.`,
    "",
  ];
  const rejected = s.filter((p) => p.action === "rejected");
  if (rejected.length) {
    out.push("## Avvist", "", "Disse kan ikke gjennomføres før de er rettet.", "");
    for (const p of rejected) out.push(`- \`${p.path}\`: ${p.reasons.join("; ")}`);
    out.push("");
  }
  const changed = s.filter((p) => p.action === "create" || p.action === "update");
  if (changed.length) {
    out.push("## Endringene", "");
    for (const p of changed) {
      out.push(`### \`${p.path}\` (${p.action === "create" ? "ny" : "endret"})`, "");
      if (p.changes.length) {
        out.push("| Felt | Før | Etter |", "|---|---|---|");
        for (const c of p.changes) out.push(`| \`${c.path}\` | ${show(c.before)} | ${show(c.after)} |`);
        out.push("");
      }
      if (p.notRemoved.length) out.push(`Fjernet i fila, men blir stående i Neo: ${p.notRemoved.join(", ")}.`, "");
      if (p.deferredSteps) out.push("Stegene i settet skrives først når en sakstype kobler det: fila skrives på nytt etter sakstypene.", "");
    }
  }
  if (notInFiles) {
    const objects = notInFiles.objects ?? [];
    const problems = notInFiles.problems ?? [];
    out.push("## Ikke styrt fra repoet", "");
    out.push(objects.length ? "Dette finnes i sandkassen uten en fil her. Gjennomføringen rører det ikke." : "Alt i sandkassen har en fil her.", "");
    for (const o of objects) out.push(`- ${o.kind} «${o.key}» (\`${o.path}\`)`);
    for (const p of problems) out.push(`- ${p.kind} «${p.key}»: ${p.problem}`);
    out.push("");
  }
  return out.join("\n");
}

// Forskjellene mellom en godkjent plan og nye svar, per fil. Tom liste: planen er den samme.
export function differences(approved, plans) {
  const now = new Map(summary(plans).map((p) => [p.path, p]));
  const diffs = [];
  for (const a of approved) {
    const n = now.get(a.path);
    if (!n) diffs.push(`${a.path}: mangler i den nye planen`);
    else if (n.action !== a.action) diffs.push(`${a.path}: var ${a.action}, er nå ${n.action}`);
    else if (JSON.stringify(n.changes) !== JSON.stringify(a.changes)) diffs.push(`${a.path}: endringene er ikke de samme som ble godkjent`);
    now.delete(a.path);
  }
  for (const path of now.keys()) diffs.push(`${path}: var ikke med i planen som ble godkjent`);
  return diffs;
}
