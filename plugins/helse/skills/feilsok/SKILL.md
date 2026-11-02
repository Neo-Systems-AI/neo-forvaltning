---
name: feilsok
description: Feilsøk av én flyt eller én kjøring i Neo - hvilket steg som feilet, hvorfor, om det er oppsettet eller produktet, og hva som bør endres. Bare lesing; en retting i oppsettet går gjennom /forvaltning:plan.
---

# Feilsøket

1. Finn kjøringen: den kunden viser til, eller den siste feilede for flyten (`list_workflow_executions`).
2. `get_workflow_execution`: stegene, inputen og feilen. `get_workflow`: definisjonen slik den var.
3. Sammenlign med repoet: står flyten i `oppsett/`, og er den lik det som kjører (siste snapshot)? En endring utenom
   repoet er ofte årsaken.
4. Avgjør hvor feilen er:
   - **Oppsettet** (en betingelse, et felt som mangler, en status som er omdøpt): foreslå endringen i `oppsett/` og
     lag planen (`/forvaltning:plan`).
   - **Data** (saken mangler noe flyten forventer): si hvilken sak og hva som mangler.
   - **Produktet** (Neo selv feiler): beskriv det så Neo kan gjenskape det, og meld det. Ikke lag en vei rundt det
     i oppsettet.
5. Skriv funnet i `beslutninger.md` når det fører til en endring.

Bare lese-verktøyene. Kjør aldri flyten på nytt herfra uten at kunden har bedt om det.
