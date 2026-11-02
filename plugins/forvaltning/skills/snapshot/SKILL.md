---
name: snapshot
description: Henter oppsettet som kjører i Neo (sakstyper, statusløp, felt, oppgavemaler og flyter) gjennom MCP og lagrer det som filer i repoet, normalisert så det kan sammenlignes over tid og mellom sandkasse og produksjon. Bare lesing. Kjør før og etter hver endring, og når du skal se hva som har endret seg utenom repoet.
---

# Snapshot av oppsettet

Et snapshot er backup, grunnlag for planen og historikk: git-historikken til `snapshots/` er historikken til
oppsettet. Det endrer ingenting i Neo.

## Før du starter

1. Les `kunde.yaml`. Den sier hvilke miljøer som finnes (`sandkasse`, `produksjon`) og MCP-adressen til hvert.
2. Sjekk at MCP-serveren for miljøet er koblet til og logget inn (`/mcp`): `neo-sandkasse` eller `neo-produksjon`. Mangler den, står oppsettet i `README.md` i
   repoet. Innloggingen er personens egen. Del aldri et token.
3. Spør hvilket miljø, om det ikke er sagt. Standard er `sandkasse`.

## Slik gjør du det

1. Kall disse verktøyene og lagre hvert svar uendret som JSON i `snapshots/<miljø>/raw/<verktøy>.json`:
   - `list_case_types`
   - `get_case_status_pipeline`
   - `list_custom_fields`
   - `list_task_template_sets`, og `get_task_template_set` for hvert sett (`get_task_template_set--<nøkkel>.json`)
   - `list_workflows`, og `get_workflow` for hver flyt (`get_workflow--<nøkkel>.json`)

   `<nøkkel>` er objektets navn i små bokstaver med bindestrek, aldri id-en: filnavnet skal være likt i sandkassen
   og i produksjonen. Finnes ikke et verktøy for tokenet ditt, skriv det i oppsummeringen og fortsett med resten.
2. Normaliser og oppdater låsefila:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/normalize.mjs" snapshots/<miljø>/raw snapshots/<miljø>/oppsett --lock state/<miljø>.lock.json
   ```
3. `raw/` committes ikke (den står i `.gitignore`). `snapshots/<miljø>/oppsett/` og låsefila committes, med
   meldingen `snapshot: <miljø> <dato>`.
4. Si kort hva som er endret siden forrige snapshot (`git diff --stat snapshots/<miljø>/oppsett`). En endring ingen
   har gjort gjennom repoet, er et avvik: skriv det i `beslutninger.md` som «avvik funnet», så kunden kan avgjøre om
   det skal tas inn i oppsettet eller rulles tilbake.

## Det som ikke er med ennå

Maler, instrukser, tagger, arkivoppsettet og tilgangsgruppene har ikke MCP-verktøy ennå. De står i `oppsett/manuelt/`
som tekst og kontrolleres for hånd.
