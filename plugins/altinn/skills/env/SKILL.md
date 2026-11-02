---
name: env
description: Viser hva altinn trenger i .claude/neo.config.json, hva som er satt, hvor verdien kom fra, og hva som mangler. Bare lesing. Kjør denne først når noe i altinn ikke gir det du venter.
---

# Config for altinn

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/lib/neo-config.mjs" --check
```

- **Kilden** står på hver linje: `config` er valgt i fila, `plugin-standard` følger med pluginen, `usatt` mangler.
- **Mangler fila**, kjør `/forvaltning:oppstart`, eller kopier `.claude/neo.config.json` fra `neo-forvaltning-mal`.
- **Fila har ingen hemmeligheter.** Nøkkelen til Maskinporten-klienten står bare som referanse (`$env`, `kilde` og
  `"fil": true`). Den hentes til `.keys/` av et menneske med `/forvaltning:hemmeligheter`, aldri av agenten.
- **Miljøene og Maskinporten-nøklene** trengs bare til `altinn-kall`. Publiseringen trenger dem ikke.
