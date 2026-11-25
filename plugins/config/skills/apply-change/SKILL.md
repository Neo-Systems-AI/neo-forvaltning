---
name: apply-change
description: Skriver en godkjent endring i konfigen til sandkassen i Neo - apply_config per fil med planHash fra planen i PR-en, i rekkefølgen Neo gir, og stopp ved første feil. Bare mot en sandkasse; promoteringen til org-en gjør et menneske i Neo. Bruk bare når PR-en med planen er godkjent.
---

# Skrivingen

Det som skrives, er det som ble godkjent: filene på commiten planen ble laget for, med `planHash` fra planen. Alt
annet er en ny plan.

## Før du starter

- **PR-en er godkjent** av godkjenneren i `repo.yaml` (og `CODEOWNERS`). Er den ikke det, stopp og si det.
- **Planen gjelder commiten** du står på. Er en konfigfil endret etter planen, lag planen på nytt og få den godkjent.
- **MCP-serveren** for miljøet (`node "${CLAUDE_PLUGIN_ROOT}/scripts/lib/mcp-server.mjs"`) er logget inn i
  sandkassen til org-en. Produksjonen skrives aldri herfra.

## Slik gjør du det

1. **Fil for fil,** i rekkefølgen planen har: `apply_config` med `file: { path, text }` og `planHash` for fila. En fil
   planen sa var `unchanged`, hoppes over.
2. **Stopp ved første feil.**
   - `PLAN_STALE` (409): fila eller objektet i sandkassen er endret siden planen. Lag planen for resten på nytt, og få
     den godkjent før du går videre.
   - Avvist (422): vis grunnene fra Neo. Fila rettes i repoet, med en ny plan.
   - `SANDBOX_NOT_READY`: sandkassen er ikke ferdig klonet. Vent, og prøv igjen.
3. **`deferredSteps`:** når sakstypen som kobler et nytt oppgavemal-sett er skrevet, lag planen for settet på nytt og
   skriv det, så stegene kommer med. Si det i PR-en.
4. **Hent konfigen fra sandkassen etterpå,** og se at `git diff` er tom for filene som er skrevet. En diff betyr at Neo
   har noe annet enn repoet; si hva.

## Etterpå

Skriv i PR-en hva som er skrevet (filene og id-ene Neo ga), hva som gjenstår, og hva som ikke ble skrevet og hvorfor.
Si så til den som skal teste og promotere:

- **En flyt lander som utkast.** Den aktiveres i Neo, av en person med rett til det, etter at gapene er lest.
- **Det som er fjernet fra en fil** (`notRemoved`), står i sandkassen til det fjernes i Neo.
- **Promoteringen** fra sandkassen til org-en gjør et menneske i Neo, og den står i revisjonsloggen der. Si hva som
  bør testes før det.

## Regler

- **Bare sandkassen,** og bare med `planHash` fra den godkjente planen.
- **Team, roller og tilgang** er miljø, ikke konfig: de settes opp av et menneske i Neo.
