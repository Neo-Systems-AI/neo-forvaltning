---
name: env
description: Viser hva forvaltning trenger i .claude/neo.config.json, hva som er satt, hvor verdien kom fra, og hva som mangler. Bare lesing. Kjør denne først når noe i forvaltning ikke gir det du venter.
---

# Config for forvaltning

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/lib/neo-config.mjs" --check
```

- **Kilden** står på hver linje: `config` er valgt i fila, `plugin-standard` følger med pluginen, `usatt` mangler.
- **Mangler fila**, kjør `/forvaltning:oppstart`, eller kopier `.claude/neo.config.json` fra `neo-forvaltning-mal`.
- **Maskinklienten** står i `neo.byEnv.<miljø>.apiClient` (`clientId`, og `clientSecret` som referanse). Sjekken over
  viser den ikke; skriptene sier fra når den mangler, og `node "${CLAUDE_PLUGIN_ROOT}/scripts/konfig.mjs" token` viser
  om Neo godtar den.
- **Fila har ingen hemmeligheter.** Maskinklientens hemmelighet står bare som referanse til kundens hvelv, og hentes
  til `.env.local` av et menneske (`/forvaltning:hemmeligheter`).
