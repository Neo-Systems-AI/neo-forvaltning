# solution

Å designe og bygge en løsning i Neo: fra en idé eller en kunngjøring til konfig som er testet i UI og gitt til kunden.
Løpet er skillene under, i rekkefølge. Hver skill gjør ett ledd og vet ikke om de andre; løpet står bare her.

## Løpet

| # | Skill | Spørsmålet | Fra → til | Personen avgjør |
|---|---|---|---|---|
| 01 | `solution:01-research-organisation` | Hvem er kunden, og hva gjelder på tvers? | `kunde.yaml` → `virksomheten/` | Spørsmålene til kunden |
| 02 | `solution:02-research-process` | Hvordan går prosessen, og hva sier hjemmelen? | En idé eller en kunngjøring → `1-kilder` og `2-forstaelse`, kontrollert mot kildene av en egen agent | Avvikene i forståelsen |
| 03 | `solution:03-write-requirements` | Hva må holde? | Forståelsen → `3-krav` | Kravene |
| 04 | `solution:04-choose-design` | Hvilke valg gjør vi? | Kravene → `4-design`: hva løsningen bygger på, variantene, og hva som er felles i `organisasjon/` | Designvalgene |
| 05 | `solution:05-build-config` | Hvordan ser konfigen ut? | Krav, design og mønstrene → `5-oppsett` og `organisasjon/`, med sporingen | — |
| 06 | *kommer* | Er det i sandkassen eller staging? | Konfigen → testmiljøet | — |
| 07 | `solution:07-write-tests` | Hva skal prøves i UI? | Kravene → testcasene, testplanen og personaene | — |
| 08 | `solution:08-run-ui-test` | Holder det i UI? | Testplanen → en runde med funn, og observasjonene ordrett | Observasjonene |
| 09 | `solution:09-triage-findings` | Hva retter vi, og hvor? | Funnene → konfig (tilbake til 05) eller produkt (et ønske til Neo) | Hva som er konfig, og hva som er produkt |
| 10 | *kommer* | Er det klart til bruk? | Løsningen → i bruk hos kunden | Publiseringen |

01 tas én gang per kunde; resten per løsning. 08 og 09 går i runder, med 05 og 07 imellom, til funnene er tatt. 06 og 10
er å få konfigen inn i Neo og ut til bruk; til de finnes, gjøres det med verktøyene i repoet.

**Ved siden av løpet:**

| Skill | Når |
|---|---|
| `solution:review-config` | Konfigen i et miljø gjennomgått mot mønstrene, med tiltak. Før overleveringen, når et oppsett tas over, eller jevnlig |
| `solution:hand-over-to-customer` | Den testede løsningen gitt til kunden i én PR kunden godkjenner |
| `solution:env` | Config-fila slik pluginen leser den |

## Hvor det står

Skillene bruker strukturen i kunderepoet fra malen [`neo-forvaltning-mal`](https://github.com/Neo-Systems-AI/neo-forvaltning-mal):
`virksomheten/` for det som gjelder hele kunden, `losninger/<løsning>/` med de seks leddene, `organisasjon/` for
konfigen utenfor løsningene, og `integrasjoner/<system>/`. Formen på hver mappe står i repoets regler (`.claude/rules/`),
og repoets sjekk holder den.

Mønstrene for god konfig og oppskriftene for integrasjonene står i [`docs/`](../../docs) i dette repoet.
`scripts/docs.mjs` finner dem for skillene, i samme versjon som pluginen kom fra.

## Skriptene

| Skript | Hva |
|---|---|
| `scripts/rules.mjs` | Reglene i mønstrene som kan sjekkes maskinelt, kjørt på konfigen slik den kjører i et miljø. Hver regel har samme id som i mønstrene |
| `scripts/uttrekk.mjs` | Henter det reglene leser (sakstypene, feltene og flytene) rett fra Neo sitt API med maskinklienten i `neo.byEnv.<miljø>.apiClient` |
| `scripts/docs.mjs` | Stien til `docs/monstre` eller `docs/integrasjoner` |

## Config

| Nøkkel | Hva |
|---|---|
| `solution.off` | Reglene som er slått av i dette repoet, med id |
