---
name: env
description: Viser hva enhetsregisteret trenger i .claude/neo.config.json, hva som er satt, hvor verdien kom fra, og hva som mangler. Bare lesing. Kjør denne først når noe i enhetsregisteret ikke gir det du venter.
---

# Config for enhetsregisteret

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/lib/neo-config.mjs" --check
```

- **Kilden** står på hver linje: `config` er valgt i fila, `plugin-standard` følger med pluginen, `usatt` mangler.
- **Mangler fila**, kjør `/forvaltning:oppstart`, eller kopier `.claude/neo.config.json` fra `neo-forvaltning-mal`.
- **Ingen hemmeligheter.** Enhetsregisteret er åpent. Uten config-fil brukes produksjon.
