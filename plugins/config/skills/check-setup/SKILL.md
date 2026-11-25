---
name: check-setup
description: Viser hva hver plugin fra neo-forvaltning som er på i repoet, trenger i .claude/neo.config.json, hva som er satt, hvor verdien kom fra og hva som mangler, og om MCP-serveren for hvert miljø er lagt til. Bare lesing. Kjør først når en plugin ikke gir det du venter, og etter at repoet er satt opp.
---

# Sjekken av oppsettet

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/check-setup.mjs"
```

Én tabell per plugin som er på i `.claude/settings.json`, med nøklene pluginen leser:

- **Kilden** står på hver linje: `config` er valgt i fila, `plugin-standard` følger med pluginen, `usatt` mangler.
- **❌** er en påkrevd nøkkel som mangler, eller en plugin som er på men ikke installert. Rett det i
  `.claude/neo.config.json`, eller installer pluginen med `/plugin install <plugin>@neo-forvaltning`.
- **MCP-serverne:** hvert miljø i `neo.environments` med serveren config-fila gir, og om den står i `.mcp.json`.
  Mangler den, legg den til med kommandoen Neo viser under *API-klienter → Koble til Claude*, og be personen logge inn
  med `/mcp`.

## Regler

- **Config-fila har ingen hemmeligheter.** Der en plugin trenger en verdi fra hvelvet, står bare navnet på variabelen
  (`{ "$env": … }`); hvor verdien ligger, står i `integrasjoner/<system>/hemmeligheter.yaml`.
- **Mangler fila,** kopier `.claude/neo.config.json` fra `neo-forvaltning-mal`, og fyll inn miljøet.
