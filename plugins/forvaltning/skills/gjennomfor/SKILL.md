---
name: gjennomfor
description: Gjennomfører en godkjent plan i Neo sin sandkasse, én fil om gangen, med apply_config gjennom MCP. Neo skriver hver fil i én transaksjon og nekter om sandkassen er endret siden planen. Promoteringen til produksjon gjøres av kundens org-admin i Neo. Bruk bare når PR-en med planen er godkjent.
---

# Gjennomføringen

## Før du starter

- PR-en med planen er godkjent av den som står som godkjenner i `kunde.yaml` (og i `CODEOWNERS`), og merget. Er den
  ikke det, stopp og si det. Gjennomfør fra `main`, så filene er de som ble godkjent.
- Du bruker MCP-serveren for sandkassen (`neo-config.mjs --miljo sandkasse`). Produksjonen endres ikke herfra:
  endringen promoteres fra sandkassen av kundens org-admin i Neo, og den står da i revisjonsloggen.

## Slik gjør du det

1. Lag planen på nytt mot sandkassen, med steg 1–3 i `/forvaltning:plan`, til
   `<reportsDir>/plan-sandkasse/raw/`. Sjekk den mot den godkjente:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/planrapport.mjs" <reportsDir>/plan-sandkasse/raw --sjekk <reportsDir>/plan-sandkasse.json
   ```

   Er den ikke den samme (exit 1), er sandkassen eller filene endret siden godkjenningen. Stopp: lag planen på nytt og
   få den godkjent.
2. For hver fil i rekkefølgen, der planen sier ny eller endret: kall `apply_config` med `file: { path, text }` og
   `planHash` fra den nye planen for samme fil. Uendrede filer hoppes over.
3. Stopp ved første feil, og si hva som er gjort og hva som gjenstår:
   - `409 PLAN_STALE`: noe er endret i sandkassen mellom planen og skrivingen. Begynn på nytt fra steg 1.
   - `422`: Neo avviste fila. Grunnene står i svaret.
   - `403 TOKEN_…`: sandkassen er satt til begrenset tilgang for Claude (for eksempel bare utkast av flyter, ikke
     KI-oppsettet). Endringen gjøres da i Neo av en person, eller org-admin åpner tilgangen.

   Det som alt er skrevet, står: hver fil er sin egen transaksjon.
4. Et oppgavemal-sett med «skrives etter sakstypene» skrives én gang til når sakstypene er skrevet: `plan_config` og
   `apply_config` for den fila på nytt.
5. Snapshot av sandkassen (`/forvaltning:snapshot sandkasse`). Filene som ble gjennomført, er nå like i
   `oppsett/` og i snapshotet.
6. Før en rad i `beslutninger.md`: dato, hva, hvem som godkjente (PR-en), hvem som gjennomførte.
7. Si til kunden at endringen ligger i sandkassen og kan promoteres, og hva som bør testes før det.

## Det Neo gjør med hver fil

- Objektet blir slik fila sier, med en versjon før og en etter i Neo.
- Det fila har fjernet, blir stående (planen viste det som «blir stående i Neo»).
- En flyt skrives som utkast. Den aktiveres i Neo.

## Det som gjøres utenom

- Det som står i `ikke-med.md` i snapshotet og i `oppsett/manuelt/` (maler, instrukser, tagger og annet Neo ikke
  skriver som fil ennå), gjøres i Neo, og snapshotet etterpå viser at det er gjort.
- Gjennomføringen gjøres av en person. En jobb i GitHub som gjør den etter godkjenningen, kommer senere.
