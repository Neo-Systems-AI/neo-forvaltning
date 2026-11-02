---
name: env
description: Viser hva fiks trenger i .claude/neo.config.json, hva som er satt, hvor verdien kom fra, og hva som mangler. Bare lesing. Kjør denne først når noe i fiks ikke gir det du venter.
---

# Config for fiks

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/lib/neo-config.mjs" --check
```

- **Kilden** står på hver linje: `config` er valgt i fila, `plugin-standard` følger med pluginen, `usatt` mangler.
- **Mangler fila**, kjør `/forvaltning:oppstart`, eller kopier `.claude/neo.config.json` fra `neo-forvaltning-mal`.
- **Fila har ingen hemmelige verdier.** Passordene og Maskinporten-nøkkelen står bare som referanser (`$env` og
  `kilde`); `/forvaltning:hemmeligheter` viser om de er satt lokalt, og et menneske henter dem.
