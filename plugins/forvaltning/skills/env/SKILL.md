---
name: env
description: Viser hva hver plugin fra neo-forvaltning som er på i repoet, trenger i .claude/neo.config.json - MCP-serveren eller maskinklienten i Neo, nøklene i fila, Maskinporten-klientene pluginene viser til, og navnene på nøklene de trenger i hvelvet - hva som er satt, hvor verdien kom fra og hva som mangler, og om MCP-serverne står i .mcp.json. Gir en feilkode når noe påkrevd mangler. Bare lesing. Kjør først når en plugin ikke gir det du venter, og etter at repoet er satt opp.
---

# Config for pluginene

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/check-setup.mjs"
```

Én tabell per plugin som er på i `.claude/settings.json`, med det pluginen leser:

- **Kilden** står på hver linje: `config` er satt i fila, `plugin-standard` følger med pluginen, `usatt` mangler, og
  `hvelvet` er en nøkkel pluginen trenger i hvelvet, med det faste navnet.
- **❌** er noe påkrevd som mangler: MCP-serveren for et miljø, en nøkkel, en klient i `maskinporten.klienter` som en
  plugin viser til, eller hvelvet (`hvelv`) når en plugin trenger en nøkkel. Skriptet gir da exit 1.
- **MCP-serverne** trengs bare for `monitoring` og `data`. Står en ikke i `.mcp.json`, legg den til med kommandoen Neo
  viser under *API-klienter → Koble til Claude* i det miljøet, og be personen logge inn med `/mcp`.
- **Maskinklienten** står i `neo.byEnv.<miljø>.apiClient.clientId`; hemmeligheten er nøkkelen `neo--<miljø>-klient`.
  `node "${CLAUDE_PLUGIN_ROOT}/scripts/konfig.mjs" token` viser om Neo godtar den.

Rett det som mangler, og kjør på nytt til den gir exit 0. Om nøklene står i hvelvet, viser `/forvaltning:nokler`.

## Regler

- **Fila har ingen hemmeligheter, heller ikke referanser.** Den sier bare hvilket hvelv; nøklene har faste navn, og
  `/forvaltning:nokler` legger dem inn.
- **Mangler fila**, kjør `/forvaltning:oppstart`, eller kopier `.claude/neo.config.json` fra `neo-forvaltning-mal`.
