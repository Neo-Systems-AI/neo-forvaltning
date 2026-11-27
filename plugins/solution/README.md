# solution

Å designe og bygge en løsning i Neo: fra en idé eller en kunngjøring til konfig som er testet i UI og gitt til kunden.
Løypa er skillene under, i rekkefølge. Hver skill gjør ett ledd og vet ikke om de andre; løypa står bare her. Veien
inn og ut av Neo (snapshot, plan og gjennomføring), oppstarten av repoet, config-fila og hemmelighetene står i
pluginen [`forvaltning`](../forvaltning/README.md).

## Løypa

| # | Skill | Spørsmålet | Fra → til | Personen avgjør |
|---|---|---|---|---|
| — | `forvaltning:oppstart` | Er repoet klart? | Malen → et repo på GHE, med sandkassen og produksjonen | Typen og kunden |
| 01 | `solution:01-research-organisation` | Hva er felles for løsningene? | → `felles/kilder` og `felles/forstaelse`: kunden i et kunderepo, målgruppen og feltet i et repo for standardløsninger | Spørsmålene |
| 02 | `solution:02-research-process` | Hvordan går prosessen, og hva sier hjemmelen? | En idé → `kilder` og `forstaelse` | Avvikene i forståelsen |
| 03 | `solution:03-write-requirements` | Hva må holde? | → `krav` | Kravene |
| 04 | `solution:04-choose-design` | Hvilke valg gjør vi? | → `design`, og det felles i `felles/` | Designvalgene |
| 05 | `solution:05-build-config` | Hvordan ser konfigen ut? | Krav, design og mønstrene → `oppsett/` i roten, i rekkefølgen Neo gir, og `blir` på kravene | — |
| 06 | `forvaltning:plan`, så `forvaltning:gjennomfor` | Er det i sandkassen? | `oppsett/` → planen fra Neo i PR-en → etter merge, fil for fil i sandkassen, og snapshotet etterpå (`forvaltning:snapshot`) | Godkjenningen av PR-en |
| 07 | `solution:07-write-tests` | Hva skal prøves i UI? | → testcasene, testplanen og personaene | — |
| 08 | `solution:08-run-ui-test` | Holder det i UI? | → en runde med funn | Observasjonene |
| 09 | `solution:09-triage-findings` | Hva retter vi, og hvor? | Funnene → konfig (tilbake til 05) eller et ønske til Neo | Konfig eller produkt |

01 tas én gang per repo; resten per løsning. 08 og 09 går i runder, med 05,
06 og 07 imellom, til funnene er tatt. Promoteringen fra sandkassen til produksjonen gjør kundens org-admin i Neo.
Å pakke løsningen som en Løsning i Neo er ikke en del av løypa: i dag lager bare Neo og partnere Løsninger,
og kunden tar dem i bruk fra katalogen.

**07–09 har sitt hjem her.** Testene for konfig i Neo skrives, kjøres og sorteres med disse skillene; det finnes ingen
egen kopi andre steder. Testcasene og personaene lages i sandkassen av et menneske, til Neo har et API for det; 07
skriver lista over hva som skal lages.

**Ved siden av løypa:**

| Skill | Når |
|---|---|
| `solution:review-config` | Konfigen slik den kjører i et miljø, gjennomgått mot mønstrene, med tiltak |
| `solution:hand-over-to-customer` | Den testede løsningen gitt til kunden i én PR kunden godkjenner |

## Repoet

Skillene bruker strukturen fra malen [`neo-forvaltning-mal`](https://github.com/Neo-Systems-AI/neo-forvaltning-mal).
Formen på hver mappe står i README.md i mappa, og sjekken holder den. Hele treet finnes fra start, tomt.

```text
kunde.yaml                    typen (kunde eller standard: hvem som eier løsningene), godkjenneren, forvalteren, versjonene
felles/                       det som gjelder hele org-en, med de samme leddene som en løsning
  kilder/ forstaelse/         det som er felles: kunden, eller målgruppen og feltet for standardløsninger
  krav/ design/               det som er felles for flere løsninger
losninger/<losning>/          losning.yaml, kilder/, forstaelse/, krav/, design/, test/
oppsett/                      konfigen i Neos format, én fil per objekt, slik Neo eksporterer den
snapshots/<miljø>/            det som kjører i sandkassen og produksjonen, fra Neo
reports/                      planene fra Neo
integrasjoner/<system>/       hos-kunden.md, og artefaktene systemet trenger
test/personaer/               testbrukerne, felles for alle løsningene
.claude/neo.config.json       miljøene i Neo, hvelvet, og én del per plugin. Ingen hemmeligheter
```

- **Mappene har navn, ikke tall.** Rekkefølgen står i løypa.
- **Konfigen står i `oppsett/` i roten,** som Neo eksporterer den. En løsning og `felles/` har ingen egen `oppsett/`.
- **Et krav sier selv hva det ble** (`blir`): en fil i `oppsett/` (`fil: oppsett/case-types/<nøkkel>.yaml`), et steg et
  menneske gjør i Neo, eller et ønske til Neo, de to siste med `hvorfor`. Det finnes ingen egen sporingsfil.
- **Et avvik fra mønstrene** står i `design/` med regelens id og grunnen (`avvik`, `grunn`), og meldes ikke på nytt.
- **Konfigen er Neos format, uendret:** én fil per objekt i `oppsett/<mappa for typen>/`. Om innholdet er gyldig,
  avgjør Neo i planen; sjekken av repoet ser bare at filene er Neos filer.

## Skriptene

| Skript | Hva |
|---|---|
| `scripts/rules.mjs` | Reglene i mønstrene som kan sjekkes maskinelt, kjørt på konfigen slik den kjører i et miljø. Hver regel har samme id som i mønstrene |
| `scripts/uttrekk.mjs` | Henter det reglene leser (sakstypene, feltene og flytene) rett fra Neo sitt API med maskinklienten i `neo.byEnv.<miljø>.apiClient` |
| `scripts/docs.mjs` | Hvor mønstrene og oppskriftene står i pluginen |

## Dokumentasjonen

| Fil | Hva |
|---|---|
| [`docs/monstre/`](docs/monstre/README.md) | Reglene for god konfig: grunnreglene, og reglene per flate med beslutningstabellene |
| [`docs/oppskrifter/`](docs/oppskrifter/README.md) | Oppskriftene: hvordan klossene i Neo settes sammen for behov man kjenner igjen, med reglene hver kloss følger |

**Tre begreper, ett sted hver.** En **regel** er én vurdering om én kloss i konfigen (id, hva den gjelder, gjør, ikke
gjør, hvorfor). En **flate** er alle reglene for én del av konfigen i én fil, med en beslutningstabell øverst; samlingen
av flatene heter mønstrene. En **oppskrift** setter klossene sammen for et kjent behov (godkjenning, innhenting fra
parten, vedtak …): hvilke klosser, hvordan de kobles, i hvilken rekkefølge, og hva hvert steg blir. Den har ingen
kunnskap av egen; den viser til reglene. 04 velger oppskriftene, og 05 bygger etter dem.
| [`docs/esignering.md`](docs/esignering.md) | eSignering hos Digdir |

## Config

| Nøkkel | Standard | Hva |
|---|---|---|
| `solution.off` | `[]` | Reglene i mønstrene som er slått av i dette repoet, med id |
