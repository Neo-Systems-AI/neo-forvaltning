---
name: hemmeligheter
description: Viser hvilke hemmeligheter repoet viser til (maskinklienten mot Neo, Maskinporten-nøklene, passordene til systemene), hvor referansen til hver står, hvor verdien ligger i hvelvet, og om personen når den med sin egen innlogging. Bare navn, aldri verdier. Ingenting hentes eller lagres.
---

# Hemmelighetene

Verdien ligger i hvelvet til den som eier den, som regel kundens Azure Key Vault. Config-fila sier bare hva den heter
og hvor den ligger, aldri verdien:

```json
"passord": { "$env": "FIKS_SVARINN_PASSORD", "kilde": "azure-keyvault:<hvelv>/<navn>" }
```

Skriptene som trenger en verdi, henter den selv for kjøringen, med personens egen innlogging (`az login`), holder den i
minnet og skriver den aldri ut. Ingen kopi lagres lokalt. I en jobb i GitHub settes variabelen i `$env` fra jobbens
hemmeligheter, og da brukes den. `"fil": true` betyr at verdien er en nøkkelfil (PEM); den hentes som tekst på samme
måte. Formen og navnene i hvelvet står i `${CLAUDE_PLUGIN_ROOT}/docs/hvelvet.md`.

## Se hva som står, og om du når det

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/vis-hemmeligheter.mjs"
```

Tabellen viser variabelen, hvor referansen står, kilden, og om personen når den: skriptet spør bare om hemmeligheten
finnes og er slått på, aldri etter verdien. Med `--uten-az` vises bare referansene.

- **«Nei: Please run 'az login'»:** be personen logge inn med `az login`, i tenanten til hvelvet.
- **«Nei: Forbidden»:** personen har ikke tilgang til hvelvet. Kunden gir den (rollen står i `hvelvet.md`).

## Regler

- **Agenten henter aldri en verdi selv,** med `az keyvault secret show` eller på annen måte. Vakten i pluginen stopper
  de vanlige formene, men den er en dytt, ikke en sperre: med personens innlogging når et skript agenten skriver selv,
  også hvelvet. Det er personen som ser over agenten, som er sperren.
- **Aldri en verdi** i chatten, en fil, et notat, `settings.local.json` eller en commit. Står en verdi der en referanse
  skulle stått, ta den ut og be eieren bytte den: den er ikke hemmelig lenger.
- **Kundens verdier ligger i kundens hvelv,** med en personlig tilgang kunden har gitt og kan trekke tilbake. Ingenting
  kopieres til oss.
