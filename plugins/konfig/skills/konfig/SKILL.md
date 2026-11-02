---
name: konfig
description: Går gjennom oppsettet i Neo for ett miljø mot reglene i konfig - det som mangler beskrivelse eller hjelpetekst, navn som er brukt to ganger, flyter som ikke er publisert - og gir en prioritert liste over tiltak. Leser siste snapshot. Bare lesing.
---

# Gjennomgangen

1. Ta et ferskt snapshot (`/forvaltning:snapshot <miljø>`) hvis det siste er eldre enn i dag.
2. Kjør reglene (mappa fra `forvaltning`: `<snapshotDir>/<miljø>/oppsett`):

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/rules.mjs" <snapshotDir>/<miljø>/oppsett
   ```
3. Svar med rødt først, så gult, så info, med ett tiltak per funn. Et tiltak er en endring i `oppsett/` som går
   gjennom `/forvaltning:plan`, ikke en endring rett i Neo.
4. «Ikke vurdert» betyr at fila regelen trenger, mangler i snapshotet. Si det.

En regel kunden ikke vil ha, slås av i `.claude/neo.config.json` (`konfig.off`), med navnet. Ikke skru av en regel
for å bli kvitt et funn uten at kunden har bestemt det; før beslutningen i `beslutninger.md`.
