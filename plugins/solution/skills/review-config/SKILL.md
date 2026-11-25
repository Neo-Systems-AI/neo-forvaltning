---
name: review-config
description: Går gjennom konfigfilene i repoet mot mønstrene for god konfig - det som kan sjekkes maskinelt med skriptet (navn brukt to ganger, sakstyper uten beskrivelse, KI-forslag uten kriterium, flyter som lander som utkast), og resten ved å lese filene mot reglene per flate - med en prioritert liste over tiltak. Bare lesing. Bruk før en løsning gis til kunden, når et oppsett skal tas over, eller jevnlig.
---

# Gjennomgangen av konfigen

Mønstrene er ett regelsett. Det som kan sjekkes maskinelt, sjekker skriptet; resten leses mot reglene. Begge gir funn
med samme regel-id, så et funn alltid viser til regelen som sier hvorfor.

**Inn:** konfigfilene i repoet (`5-oppsett/` i løsningene og `organisasjon/5-oppsett/`), og mønstrene i
`${CLAUDE_PLUGIN_ROOT}/docs/monstre/`. **Ut:** funnene og tiltakene, i svaret. Endringene går som en PR i repoet.

## Slik gjør du det

1. **Filene er det som gjennomgås.** Skal gjennomgangen gjelde det som kjører i Neo, hent konfigen fra org-en inn i
   repoet først (`export_config`), på en egen gren, så filene er de Neo har.
2. **Kjør reglene:**

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/rules.mjs" [--losning <løsning>]
   ```

   «Ikke vurdert» betyr at repoet ikke har filer av typen regelen leser. Si det; det er ikke grønt.
3. **Les resten mot mønstrene,** også de delene av reglene skriptet ikke kan avgjøre. Start med grunnreglene og
   beslutningstabellene, og se etter fellene (`klasse: felle`):
   en status som er arbeid, et felt ingen leser, et utfall som to statuser, det innsikten skal telle men ingen flyt
   skriver. Les én flate om gangen.
4. **Svar** med rødt først, så gult, så info, med regel-id-en, fila og ett tiltak per funn. Et tiltak er en endring i
   en fil i repoet, ikke en endring rett i Neo.

## Regler

- **Bare lesing.** Gjennomgangen endrer ingenting i Neo.
- **En regel kunden ikke vil ha,** slås av i `.claude/neo.config.json` (`solution.off`), med id-en. Slå aldri av en
  regel for å bli kvitt et funn uten at kunden har bestemt det; beslutningen står i PR-en som slår den av.
- **Et funn som er et brudd med vilje,** står i `spor.yaml` med grunnen. Si det i stedet for å melde det som
  feil.
