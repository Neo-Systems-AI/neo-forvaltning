# solution

Å designe og bygge en løsning i Neo: fra en idé eller en kunngjøring til konfig som er testet i UI og gitt til kunden.
Løpet er skillene under, i rekkefølge. Hver skill gjør ett ledd og vet ikke om de andre; løpet står bare her.

## Løpet

| # | Skill | Spørsmålet | Fra → til | Personen avgjør |
|---|---|---|---|---|
| 01 | `solution:01-research-organisation` | Hvem er kunden, og hva gjelder på tvers? | `repo.yaml` → `virksomheten/` | Spørsmålene til kunden |
| 02 | `solution:02-research-process` | Hvordan går prosessen, og hva sier hjemmelen? | En idé eller en kunngjøring → `1-kilder` og `2-forstaelse`, kontrollert mot kildene av en egen agent | Avvikene i forståelsen |
| 03 | `solution:03-write-requirements` | Hva må holde? | Forståelsen → `3-krav` | Kravene |
| 04 | `solution:04-choose-design` | Hvilke valg gjør vi? | Kravene → `4-design`: hva løsningen bygger på, variantene, og hva som er felles i `organisasjon/4-design/` | Designvalgene |
| 05 | `solution:05-build-config` | Hvordan ser konfigen ut? | Krav, design, mønstrene og skjemaet fra Neo → `5-oppsett` og `organisasjon/5-oppsett`, med `spor.yaml` | — |
| 06 | `config:plan-change` og `config:apply-change` | Er det i sandkassen? | `5-oppsett` → sandkassen, med planen i PR-en | Godkjenningen av planen |
| 07 | `solution:07-write-tests` | Hva skal prøves i UI? | Kravene → testcasene, testplanen og personaene | — |
| 08 | `solution:08-run-ui-test` | Holder det i UI? | Testplanen → en runde med funn, og observasjonene ordrett | Observasjonene |
| 09 | `solution:09-triage-findings` | Hva retter vi, og hvor? | Funnene → konfig (tilbake til 05) eller produkt (et ønske til Neo) | Hva som er konfig, og hva som er produkt |
| 10 | *kommer* | Er det klart til bruk? | Løsningen → i bruk hos kunden | Publiseringen |

01 tas én gang per kunde, og ikke i et repo for standardløsninger; resten per løsning. 08 og 09 går i runder, med 05,
06 og 07 imellom, til funnene er tatt. 06 er pluginen `config`: planen per fil mot sandkassen i PR-en, og skrivingen
når planen er godkjent. Promoteringen fra sandkassen gjør et menneske i Neo.

**Ved siden av løpet:**

| Skill | Når |
|---|---|
| `solution:review-config` | Konfigfilene gjennomgått mot mønstrene, med tiltak. Før overleveringen, når et oppsett tas over, eller jevnlig |
| `solution:hand-over-to-customer` | Den testede løsningen gitt til kunden i én PR kunden godkjenner |

## Hvor det står

Skillene bruker strukturen i repoet fra malen [`neo-forvaltning-mal`](https://github.com/Neo-Systems-AI/neo-forvaltning-mal):
`repo.yaml` med typen (kunde eller standard), `virksomheten/` for det som gjelder hele kunden, `losninger/<løsning>/`
med `losning.yaml` og de seks leddene, `organisasjon/4-design/` og `organisasjon/5-oppsett/` for det som er felles,
`integrasjoner/<system>/`, og personaene i `test/personaer/`. Formen på hver mappe står i repoets regler
(`.claude/rules/`), og repoets sjekk holder den.

Konfigen står i Neos eget format, én fil per objekt, i mappa for typen og navngitt etter nøkkelen. Stien Neo får, er
stien under `5-oppsett/`. Skjemaet er Neos, på `GET <adressen>/api/config/schema`, og hentes; det kopieres aldri hit.

[Mønstrene for god konfig](docs/monstre/README.md) følger med pluginen, i `docs/monstre/`.

## Skriptene

| Skript | Hva |
|---|---|
| `scripts/rules.mjs` | Reglene i mønstrene som kan sjekkes maskinelt, kjørt på konfigfilene i repoet. Hver regel har samme id som i mønstrene |
| `scripts/lib/konfigfiler.mjs` | Konfigfilene med stien Neo skal ha, i rekkefølgen for apply; stopper når samme nøkkel står to steder |
| `scripts/lib/mcp-server.mjs` | MCP-serveren, adressen og org-en for et miljø |

## Config

| Nøkkel | Hva |
|---|---|
| `solution.off` | Reglene som er slått av i dette repoet, med id |
