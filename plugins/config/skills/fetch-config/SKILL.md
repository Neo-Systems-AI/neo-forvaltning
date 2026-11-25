---
name: fetch-config
description: Henter konfigen fra en org i Neo inn i repoet som filer i Neos format (export_config gjennom MCP) - hver fil til stedet den står i repoet, en ny fil bare der personen sier den hører hjemme, og det som er endret i Neo utenom repoet som en diff i git. Bruk når et repo tar over en org som finnes, når du vil se hva som er endret i Neo, og etter at noe er skrevet til sandkassen.
---

# Hentingen

Konfigen i repoet og i Neo er de samme filene. Hentingen skriver det Neo har, inn i repoet uendret, så git viser hva
som er annerledes. Den endrer ingenting i Neo.

## Før du starter

1. Slå opp MCP-serveren for miljøet:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/lib/mcp-server.mjs" [<miljø>]
   ```

   Svaret gir navnet på verktøyene og org-en config-fila sier. Si hvilket miljø og hvilken org svaret kom fra.
2. Stå på en egen gren. Hentingen blir en commit med en PR, som alle andre endringer.

## Slik gjør du det

1. **Kall `export_config`.** `ok: false` betyr at noe i Neo ikke kan skrives som fil: vis `problems` og
   `layoutProblems` som de står, og stopp. De rettes i Neo.
2. **Finn stedet for hver fil.** Lista over filene repoet har, med stien Neo bruker:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/lib/konfigfiler.mjs" --uten-neo --json
   ```

   - **Står stien i repoet,** skriv `text` til fila der den står, uendret.
   - **Står den ikke i repoet,** legg den ikke inn stille. Vis personen fila (typen, nøkkelen, hva den handler om) og
     spør hvilken løsning den hører til, eller om den er felles og hører i `organisasjon/5-oppsett/`. Hører den ikke
     til noe repoet forvalter, la den stå utenfor, og si det.
   - **Står en fil i repoet som ikke kom fra Neo,** er den ny i repoet og ikke skrevet ennå. Den røres ikke.
3. **Sjekk filene** med samme liste uten `--uten-neo`: stiene, filnavnene og at ingen nøkkel står to steder.
4. **Les diffen** (`git diff --stat`, så per fil). En endring ingen har gjort gjennom repoet, er gjort i Neo utenom
   repoet. Si hva som er endret, i klartekst. Om endringen skal tas inn i repoet eller rulles tilbake, avgjør
   godkjenneren i PR-en.
5. **`notExported`** er det Neo med vilje ikke gir som fil ennå. Si hva det er, med grunnen; det forvaltes i Neo.

## Regler

- **Teksten fra Neo endres ikke** før den er committet. En retting er en egen commit, så diffen viser hva Neo har.
- **Én org om gangen,** og alltid den config-fila sier for miljøet. Er MCP-serveren logget inn i en annen org, stopp.
