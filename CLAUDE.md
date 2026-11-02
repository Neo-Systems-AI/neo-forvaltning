# neo-forvaltning

Neo Systems sine offentlige plugins til Claude Code. Repoet er offentlig: alt som committes, kan leses av alle.

## Regler

- **Bare det en kunde eller partner skal bruke.** Det som er internt hos Neo Systems, hører ikke hjemme her.
- **Ingenting om en enkelt kunde**, heller ikke som eksempel. Bruk oppdiktede eksempler.
- **Ingen hemmeligheter.** Innloggingen er alltid personens egen; et token står aldri i en fil.
- **Tynn mal, tykke plugins:** innhold hører hjemme her, i en versjonert plugin. Malen (`neo-forvaltning-mal`) har bare
  struktur, regler og låste versjoner.
- **Versjonen bumpes to steder** (`plugin.json` og `.claude-plugin/marketplace.json`), minor for noe nytt, patch for en fiks.
- **Alt til `main` går gjennom PR** med `check` grønn, med merge commit.
- Teksten er norsk. Stier i hooks og skript bruker `${CLAUDE_PLUGIN_ROOT}`.
- Digdirs skills i `plugins/altinn` endres aldri for hånd: `node plugins/altinn/scripts/sync-skills.mjs` henter dem.
