---
name: hemmeligheter
description: Viser hvilke hemmeligheter kallene mot de eksterne systemene trenger (Maskinporten-nøkler, passord til SvarInn og andre), hvor hver av dem ligger i kundens hvelv, og om de er satt lokalt. Bare navn, aldri verdier. Sier hvordan et menneske henter dem.
---

# Hemmelighetene

Kunden eier hemmelighetene: Maskinporten-klientene, nøklene, virksomhetssertifikatet og passordene til systemene. De
ligger i kundens hvelv. Config-fila sier bare hvor hver av dem ligger, aldri verdien:

```json
"passord": { "$env": "FIKS_SVARINN_PASSORD", "kilde": "azure-keyvault:<hvelv>/<navn>" }
```

`"fil": true` betyr at verdien er en nøkkelfil; den hentes til `.keys/`.

## Se hva som er satt

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/hent-hemmeligheter.mjs" --sjekk
```

Tabellen viser navnet, hvor i config-fila det står, kilden, og om det er satt. Aldri verdien.

## Hente dem

Hentingen gjøres av **et menneske**, med sin egen innlogging mot kundens hvelv (`az login`). Agenten kjører den aldri,
og leser aldri `.env.local` eller `.keys/`; vakten i pluginen stopper det. Be personen kjøre:

```bash
node <plugin-mappa>/scripts/hent-hemmeligheter.mjs --hent
```

Verdiene skrives til `.env.local` og `.keys/` med tilgang bare for eieren (600). Begge står i `.gitignore`, og `check`
i kunderepoet stopper dem om de likevel blir lagt til.

## Når vi forvalter for kunden

Vi bruker kundens hvelv med en personlig tilgang kunden har gitt og kan trekke tilbake. Ingenting kopieres til oss.
Testorganisasjonene vi bruker når vi bygger, hører ikke hjemme i kundens repo.
