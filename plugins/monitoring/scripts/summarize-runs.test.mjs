import { test } from "node:test";
import assert from "node:assert/strict";
import { markdown, summarize, unwrap, verdict, windowMs } from "./summarize-runs.mjs";

const now = Date.parse("2026-11-03T12:00:00Z");
const flows = [
  { flow: "varsel", data: { items: [
    { id: "e3", status: "FAILED", startedAt: "2026-11-03T11:00:00Z", errorMessage: "Mottaker mangler" },
    { id: "e2", status: "COMPLETED", startedAt: "2026-11-03T10:00:00Z" },
    { id: "e1", status: "FAILED", startedAt: "2026-11-01T10:00:00Z" },
  ] } },
  { flow: "arkiv", data: [{ id: "a1", state: "completed", createdAt: "2026-11-03T09:00:00Z" }] },
  { flow: "stille", data: [] },
];

test("vinduet", () => assert.equal(windowMs("7d"), 7 * 86400e3));
test("MCP-svaret pakkes ut", () => assert.deepEqual(unwrap({ content: [{ type: "text", text: "[1]" }] }), [1]));

test("teller i vinduet, og finner siste feil", () => {
  const [varsel, arkiv] = summarize(flows, { window: "24h", now });
  assert.deepEqual(varsel, { flow: "varsel", runs: 2, failed: 1, lastFailedAt: "2026-11-03T11:00:00.000Z", lastError: "Mottaker mangler", lastFailedId: "e3", unknownTime: 0 });
  assert.equal(arkiv.failed, 0);
});

test("ingen flyter er UKJENT, ikke grønt", () => {
  assert.equal(verdict([]), "UKJENT");
  assert.equal(verdict(summarize(flows, { now })), "gult");
});

test("oversikten viser bare det som krever noe, og teller resten", () => {
  const md = markdown(summarize(flows, { now }), "24h");
  assert.match(md, /\| varsel \| 2 \| 1 \|/);
  assert.match(md, /1 flyter uten feil, 1 uten kjøringer i vinduet/);
});
