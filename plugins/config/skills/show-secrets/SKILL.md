---
name: show-secrets
description: Viser hvilke hemmeligheter repoet trenger (nøklene og passordene til integrasjonene og testidentitetene til personaene), hvor referansen til hver står, hvor verdien ligger i hvelvet, og om den er satt lokalt. Bare navn, aldri verdier. Sier hvordan et menneske henter dem.
---

# Hemmelighetene

Verdien ligger i hvelvet til den som eier den. Repoet har bare referansen, der den brukes: i
`integrasjoner/<system>/hemmeligheter.yaml` og under `hemmeligheter` i personaene i `test/personaer/`. Formen på en
referanse, kildene og navnene i hvelvet står i `${CLAUDE_PLUGIN_ROOT}/docs/hvelvet.md`; les den når noe er uklart.

## Se hva som er satt

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/hent-hemmeligheter.mjs" --sjekk
```

Tabellen viser navnet på variabelen, hvor referansen står, kilden, og om den er satt. Aldri verdien. En linje med ✗
er en referanse som ikke kan brukes: en verdi der en referanse skulle stått, eller samme navn med to kilder. Rett den i
fila den står i.

## Hente dem

Hentingen gjøres av **et menneske**, med sin egen innlogging mot hvelvet (`az login`). Agenten kjører den aldri, og
leser aldri `.env`, `.env.*` eller `.keys/`; vakten i pluginen stopper det. Be personen kjøre:

```bash
node "<mappa til pluginen config>/scripts/hent-hemmeligheter.mjs" --hent
```

Verdiene skrives til `.env.local` og `.keys/`, med tilgang bare for eieren. Begge står i `.gitignore`, og `check` i
repoet stopper dem om de likevel blir lagt til.

## Regler

- **Bare Key Vault og `manuell`.** En annen kilde er en feil i referansen.
- **Kundens verdier ligger i kundens hvelv,** med en personlig tilgang kunden har gitt og kan trekke tilbake. Ingenting
  kopieres til oss. Testorganisasjonene og testidentitetene vi bygger med, ligger i vårt hvelv.
