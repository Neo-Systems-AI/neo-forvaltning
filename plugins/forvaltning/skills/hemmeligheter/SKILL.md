---
name: hemmeligheter
description: Viser hvilke hemmeligheter repoet viser til (nøklene og passordene til integrasjonene, og testidentitetene til personaene), hvor referansen til hver står, hvor verdien ligger i hvelvet, og om personen når den med sin egen innlogging. Bare referansene, aldri verdier.
---

# Hemmelighetene

Verdien ligger i Azure Key Vault, i hvelvet til den som eier den. Repoet har bare referansen, der den brukes: under
`<system>.hemmeligheter` i `.claude/neo.config.json`, og under `hemmeligheter` i personaene i `test/personaer/`.
Skriptene henter verdien fra hvelvet ved hvert kall, med personens egen innlogging, så ingen verdi ligger lagret på
disk. Formen på en referanse og navnene i hvelvet står i `${CLAUDE_PLUGIN_ROOT}/docs/hvelvet.md`.

## Se hva som står, og om du når det

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/vis-hemmeligheter.mjs"
```

Tabellen viser hvor referansen står, kilden i hvelvet, om den er en fil, og om personen når den: skriptet spør bare om
hemmeligheten finnes og er slått på, aldri etter verdien. Med `--uten-az` vises bare referansene.

- **«Nei: Please run 'az login'»:** be personen logge inn med `az login`, i tenanten til hvelvet.
- **«Nei: Forbidden»:** personen har ikke tilgang til hvelvet. Kunden gir den (rollen står i oppskriften for hvelvet).
- **❌ ikke en referanse:** en verdi står der referansen skulle stått. Ta den ut av fila, og be eieren bytte den: den er
  ikke hemmelig lenger. Er den committet, ligger den i historikken: byttet er det som hjelper.

## Regler

- **Aldri en verdi** i chatten, en fil, et notat eller en commit. Skriptene som trenger en verdi, henter den selv.
- **Bare Key Vault.** En annen kilde er en feil i referansen.
- **Kundens verdier ligger i kundens hvelv,** med en personlig tilgang kunden har gitt og kan trekke tilbake. Ingenting
  kopieres til oss. Testidentitetene vi bygger med, ligger i vårt hvelv.
