---
name: check-setup
description: Viser hva hver plugin fra neo-forvaltning som er på i repoet, trenger i .claude/neo.config.json, også referansene til hvelvet under <system>.hemmeligheter, hva som er satt, hvor verdien kom fra og hva som mangler, også Maskinporten-klientene pluginene viser til, og om MCP-serveren står i .mcp.json. Gir en feilkode når noe påkrevd mangler. Bare lesing. Kjør først når en plugin ikke gir det du venter, og etter at repoet er satt opp.
---

# Sjekken av oppsettet

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/check-setup.mjs"
```

Én tabell per plugin som er på i `.claude/settings.json`, med det pluginen leser:

- **Kilden** står på hver linje: `config` er satt i fila, `standard` følger med pluginen, `usatt` mangler, og
  `referanse` er en referanse til hvelvet under `<system>.hemmeligheter`.
- **❌** er noe påkrevd som mangler: en nøkkel, en klient i `maskinporten.klienter` som en plugin viser til, eller en
  referanse til hvelvet. Skriptet gir da exit 1.
- **MCP-serveren:** står den ikke i `.mcp.json`, legg den til med kommandoen Neo viser under *API-klienter → Koble til
  Claude*, og be personen logge inn med `/mcp`.

Rett det som mangler, og kjør sjekken på nytt til den gir exit 0. Om referansene kan nås i hvelvet, viser
hemmelighetene, ikke denne.

## Regler

- **Config-fila har ingen hemmeligheter.** Under `<system>.hemmeligheter` står bare referansene til hvelvet, ved siden
  av oppsettet av systemet.
- **Mangler fila,** kopier `.claude/neo.config.json` fra `neo-forvaltning-mal`, og fyll inn Neo.
