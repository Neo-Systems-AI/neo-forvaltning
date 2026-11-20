---
name: review-config
description: Går gjennom konfigen i Neo for ett miljø mot mønstrene for god konfig - det som kan sjekkes maskinelt med reglene i skriptet (beskrivelser og hjelpetekster som mangler, navn brukt to ganger, KI-forslag uten kriterium, flyter som ikke er publisert, oppgaver uten frist), og resten ved å lese konfigen mot reglene per flate - med en prioritert liste over tiltak. Bare lesing. Bruk før en løsning gis til kunden, når et oppsett skal tas over, eller jevnlig.
---

# Gjennomgangen av konfigen

Mønstrene er ett regelsett. Det som kan sjekkes maskinelt, sjekker skriptet; resten leses mot reglene. Begge gir funn
med samme regel-id, så et funn alltid viser til regelen som sier hvorfor.

**Inn:** konfigen slik den kjører i miljøet, hentet og normalisert av repoet, og mønstrene (stien gir
`node "${CLAUDE_PLUGIN_ROOT}/scripts/docs.mjs" monstre`). **Ut:** funnene og tiltakene, i svaret. Endringene går som en
PR i repoet.

## Slik gjør du det

1. **Hent konfigen** slik den kjører nå i miljøet. Er uttrekket eldre enn i dag, hent det på nytt.
2. **Kjør reglene** på det normaliserte uttrekket:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/rules.mjs" <mappa med uttrekket>
   ```

   «Ikke vurdert» betyr at fila regelen trenger, mangler i uttrekket. Si det; det er ikke grønt.
3. **Les resten mot mønstrene.** Start med grunnreglene og beslutningstabellene, og se etter fellene (`klasse: felle`):
   en status som er arbeid, et felt ingen leser, et utfall som to statuser, det innsikten skal telle men ingen flyt
   skriver. Les én flate om gangen.
4. **Svar** med rødt først, så gult, så info, med regel-id-en, objektet og ett tiltak per funn. Et tiltak er en endring
   i konfigen i repoet, ikke en endring rett i Neo.

## Regler

- **Bare lesing.** Gjennomgangen endrer ingenting i Neo.
- **En regel kunden ikke vil ha,** slås av i `.claude/neo.config.json` (`solution.off`), med id-en. Slå aldri av en
  regel for å bli kvitt et funn uten at kunden har bestemt det; beslutningen står i PR-en som slår den av.
- **Et funn som er et brudd med vilje,** står i sporingen til objektet med grunnen. Si det i stedet for å melde det som
  feil.
