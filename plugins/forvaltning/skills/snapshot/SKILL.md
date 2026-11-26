---
name: snapshot
description: Henter oppsettet som kjører i Neo sin sandkasse som filer i repoet, slik Neo selv skriver dem, med et skript som kaller Neo sitt API med maskinklienten, og viser hva som er endret siden forrige snapshot. Bare lesing. Kjør før og etter hver endring, og når du skal se hva som har endret seg utenom repoet.
---

# Snapshot av oppsettet

Et snapshot er backup, grunnlag for oppsettet i repoet og historikk: git-historikken til snapshotene er historikken
til oppsettet. Det endrer ingenting i Neo.

Neo skriver filene selv (`GET /api/config/export`). Formen, nøklene og pekerne er Neo sine, så filene kan legges rett i
`oppsett/`, og plan og gjennomføring forstår dem uten at noe oversettes her. Skriptet henter dem med maskinklienten
(`neo.byEnv.<miljø>.apiClient`) og skriver dem selv, så svaret går ikke gjennom modellen, uansett hvor stort det er.

## Slik gjør du det

1. Ta snapshotet (miljøet er `neo.defaultEnv`, sandkassen, med mindre det er sagt):

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/konfig.mjs" export [--miljo <miljø>]
   ```

   Skriptet skriver hver fil på stien Neo ga i `<snapshotDir>/<miljø>/`, fjerner filene Neo ikke lenger har, og
   skriver `ikke-med.md`: det som finnes i Neo, men ikke er med i filene ennå, med grunnen. Det sier hvilket miljø og
   hvilken adresse det hentet fra.
2. Feiler det:
   - **Neo kan ikke skrive oppsettet som filer** (to oppgavemal-sett med samme navn, en peker uten nøkkel): ingenting
     skrives. Vis problemene til personen; de rettes i Neo, og så tas snapshotet på nytt.
   - **Maskinklienten mangler eller avvises:** se `/forvaltning:env` og `node … konfig.mjs token`.
3. Filene og `ikke-med.md` committes, med meldingen `snapshot: <miljø> <dato>`.
4. Si kort hva som er endret siden forrige snapshot (`git diff --stat`). En endring ingen har gjort gjennom repoet, er
   et avvik: skriv det i `beslutninger.md` som «avvik funnet», så kunden kan avgjøre om det skal tas inn i oppsettet
   eller rulles tilbake.

## Sandkassen og produksjonen

Snapshotet tas av sandkassen. Hva som skiller den fra produksjonen, viser forhåndsvisningen av promoteringen i Neo.

## Det som ikke er med ennå

`ikke-med.md` sier hva, per objekt. Det Neo ikke skriver som fil ennå (for eksempel skjemaer, lagrede visninger,
saksnummeret, Innsikt og flyter som tildeler til et bestemt medlem), styres i Neo og beskrives for hånd i
`oppsett/manuelt/`. Når Neo tar det med, kommer det med i neste snapshot av seg selv.
