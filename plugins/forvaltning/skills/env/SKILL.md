---
name: env
description: Viser hva hver plugin fra neo-forvaltning som er på i repoet, trenger i .claude/neo.config.json - MCP-serveren per miljø i Neo, nøklene, referansene til hvelvet under <system>.hemmeligheter og Maskinporten-klientene pluginene viser til - hva som er satt, hvor verdien kom fra og hva som mangler, og om MCP-serverne står i .mcp.json. Gir en feilkode når noe påkrevd mangler. Bare lesing. Kjør først når en plugin ikke gir det du venter, og etter at repoet er satt opp.
---

# Config for pluginene

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/check-setup.mjs"
```

Én tabell per plugin som er på i `.claude/settings.json`, med det pluginen leser:

- **Kilden** står på hver linje: `config` er satt i fila, `plugin-standard` følger med pluginen, `usatt` mangler, og
  `referanse` er en referanse til en hemmelighet.
- **❌** er noe påkrevd som mangler: MCP-serveren for et miljø, en nøkkel, en klient i `maskinporten.klienter` som en
  plugin viser til, eller en referanse til en hemmelighet. Skriptet gir da exit 1.
- **MCP-serverne** trengs bare for `monitoring` og `data`. Står en ikke i `.mcp.json`, legg den til med kommandoen Neo
  viser under *API-klienter → Koble til Claude* i det miljøet, og be personen logge inn med `/mcp`.
- **Maskinklienten** står i `neo.byEnv.<miljø>.apiClient` (`clientId`, og `clientSecret` som referanse).
  `node "${CLAUDE_PLUGIN_ROOT}/scripts/konfig.mjs" token` viser om Neo godtar den.

Rett det som mangler, og kjør på nytt til den gir exit 0. Om hemmelighetene er satt, viser `/forvaltning:hemmeligheter`.

## Regler

- **Fila har ingen hemmeligheter.** En hemmelighet står bare som referanse til kundens hvelv, og hentes til
  `.env.local` av et menneske (`/forvaltning:hemmeligheter`).
- **Mangler fila**, kjør `/forvaltning:oppstart`, eller kopier `.claude/neo.config.json` fra `neo-forvaltning-mal`.
