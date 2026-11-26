---
name: nokler
description: Nøklene repoet trenger i hvelvet - maskinklienten mot Neo, Maskinporten-nøklene og passordene til systemene - med de faste navnene pluginene bestemmer, om de står i hvelvet, og den ene kommandoen et menneske legger dem inn med. Bare navn, aldri verdier. Kjør når repoet settes opp, når en plugin eller en Maskinporten-klient kommer til, når en nøkkel skal byttes, eller når et skript sier at en nøkkel mangler.
---

# Nøklene

Nøklene ligger bare i hvelvet. Repoet sier hvilket hvelv (`hvelv` i `.claude/neo.config.json`), og pluginene sier
hvilke nøkler de trenger, med faste navn i formen `<system>--<navn>`: `neo--sandkasse-klient`,
`maskinporten--<klient>-nokkel`, `fiks--integrasjon-passord`. Ingen skriver en referanse noe sted. Skriptene henter
nøkkelen fra hvelvet for kjøringen, med personens egen innlogging, og lagrer den aldri. I CI har jobbens hemmeligheter
de samme navnene, med store bokstaver og `_`. Mer i `${CLAUDE_PLUGIN_ROOT}/docs/hvelvet.md`.

## Se hva som trengs, og om det står der

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/nokler.mjs"
```

Tabellen viser hver nøkkel pluginene som er på, trenger, hvilken plugin som trenger den, om den står i hvelvet, og
navnet den har i CI. Bare navn. Exit 1 når en påkrevd nøkkel mangler, 2 når hvelvet ikke kunne leses.

- **«Please run 'az login'»:** be personen logge inn med `az login`, i tenanten til hvelvet.
- **«Forbidden»:** personen har ikke tilgang til hvelvet. Kunden gir den (rollen står i `hvelvet.md`).
- **«hvelv er ikke satt»:** skriv navnet på hvelvet i config-fila (`"hvelv": "kv-kunde"`).

## Legg inn det som mangler

Et menneske kjører det, i en terminal, med sin egen innlogging. Agenten kjører det aldri; be personen kjøre:

```bash
node "<forvaltning>/scripts/nokler.mjs" fyll
```

Den går gjennom det som mangler, én om gangen, med hvor nøkkelen lages. Verdien limes inn uten å vises, og en
nøkkelfil (PEM) gis som en sti. Den legges i hvelvet under det faste navnet. `sett <navn>` skriver én på nytt når den
byttes. Når en plugin eller en klient kommer til senere, kjøres `fyll` igjen.

## Regler

- **Agenten henter eller legger aldri inn en verdi selv,** med `az keyvault secret` eller på annen måte. Vakten i
  pluginen stopper de vanlige formene, men den er en dytt, ikke en sperre: med personens innlogging når et skript
  agenten skriver selv, også hvelvet. Det er personen som ser over agenten, som er sperren.
- **Aldri en verdi** i chatten, en fil, et notat, `settings.local.json` eller en commit. Står en verdi i repoet, ta den
  ut og be eieren bytte den: den er ikke hemmelig lenger.
- **Kundens nøkler ligger i kundens hvelv,** med en personlig tilgang kunden har gitt og kan trekke tilbake. Ingenting
  kopieres til oss.
