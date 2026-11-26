# solution

Å designe og bygge en løsning i Neo: fra en idé eller en kunngjøring til konfig som er testet i UI og gitt til kunden,
og repoet og veien for konfigen inn og ut av Neo. Løypa er skillene under, i rekkefølge. Hver skill gjør ett ledd og
vet ikke om de andre; løypa står bare her.

## Løypa

| # | Skill | Spørsmålet | Fra → til | Personen avgjør |
|---|---|---|---|---|
| — | `solution:set-up-repo` | Er repoet klart? | Malen → et repo på GHE, satt opp for typen | Typen og kunden |
| 01 | `solution:01-research-organisation` | Hvem er kunden? | → `felles/kilder` og `felles/forstaelse` (bare et kunderepo) | Spørsmålene til kunden |
| 02 | `solution:02-research-process` | Hvordan går prosessen, og hva sier hjemmelen? | En idé → `kilder` og `forstaelse` | Avvikene i forståelsen |
| 03 | `solution:03-write-requirements` | Hva må holde? | → `krav` | Kravene |
| 04 | `solution:04-choose-design` | Hvilke valg gjør vi? | → `design`, og det felles i `felles/` | Designvalgene |
| 05 | `solution:05-build-config` | Hvordan ser konfigen ut? | Krav, design, mønstrene og skjemaet → `oppsett`, og `blir` på kravene | — |
| 06 | `solution:06-deploy-to-sandbox` | Er det i sandkassen? | `oppsett` → planen i PR-en → sandkassen etter godkjenningen | Godkjenningen |
| 07 | `solution:07-write-tests` | Hva skal prøves i UI? | → testcasene, testplanen og personaene | — |
| 08 | `solution:08-run-ui-test` | Holder det i UI? | → en runde med funn | Observasjonene |
| 09 | `solution:09-triage-findings` | Hva retter vi, og hvor? | Funnene → konfig (tilbake til 05) eller et ønske til Neo | Konfig eller produkt |

01 tas én gang per kunde, og ikke i et repo for standardløsninger; resten per løsning. 08 og 09 går i runder, med 05,
06 og 07 imellom, til funnene er tatt. Promoteringen fra sandkassen gjør et menneske i Neo. Publiseringen av en
løsning står ikke i løypa før Neo har den.

**07–09 har sitt hjem her.** Testene for konfig i Neo skrives, kjøres og sorteres med disse skillene; det finnes ingen
egen kopi andre steder. Testcasene og personaene lages i sandkassen av et menneske, til Neo har et API for det; 07
skriver lista over hva som skal lages.

**Ved siden av løypa:**

| Skill | Når |
|---|---|
| `solution:fetch-config` | Konfigen hentes fra Neo inn i repoet: når et repo tar over en org, og etter at noe er skrevet til sandkassen |
| `solution:check-setup` | Hva hver plugin som er på, trenger, og hva som mangler. Feilkode når noe mangler |
| `solution:show-secrets` | Hemmelighetene repoet viser til, og om du når dem. Aldri verdier |
| `solution:review-config` | Konfigfilene gjennomgått mot mønstrene, med tiltak |
| `solution:hand-over-to-customer` | Den testede løsningen gitt til kunden i én PR kunden godkjenner |

## Repoet

Skillene bruker strukturen fra malen [`neo-forvaltning-mal`](https://github.com/Neo-Systems-AI/neo-forvaltning-mal).
Formen på hver mappe står i repoets regler (`.claude/rules/`), og sjekken holder den.

```text
repo.yaml                     typen (kunde eller standard), eieren og forvalteren
felles/                       det som gjelder hele org-en, med de samme leddene som en løsning
  kilder/ forstaelse/         det som gjelder hele kunden (bare i et kunderepo)
  krav/ design/ oppsett/      det som er felles for flere løsninger
integrasjoner/<system>/       hos-kunden.md, og artefaktene systemet trenger
losninger/<losning>/          losning.yaml, kilder/, forstaelse/, krav/, design/, oppsett/, test/
test/personaer/               testbrukerne, felles for alle løsningene
.claude/neo.config.json       Neo (url, org, mcpServer) og én del per plugin, med referansene til hvelvet
```

- **Mappene har navn, ikke tall.** Rekkefølgen står i løypa.
- **Et krav sier selv hva det ble** (`blir`): en fil i `oppsett/` (også i `felles/oppsett/`), et steg et menneske gjør i
  Neo, eller et ønske til Neo, de to siste med `hvorfor`. Det finnes ingen egen sporingsfil.
- **Et avvik fra mønstrene** står i `design/` med regelens id og grunnen (`avvik`, `grunn`), og meldes ikke på nytt.
- **Konfigen er Neos format, uendret:** én fil per objekt i `oppsett/<mappa for typen>/`. Stien Neo får, er stien under
  `oppsett/`, og om den stemmer, avgjør Neo i planen. Skjemaet hentes fra `<neo.url>/api/config/schema`; det kopieres
  aldri hit.

## Skriptene

| Skript | Hva |
|---|---|
| `scripts/sjekk.mjs` | Sjekken av repoet: strukturen for typen, kildene på endringen, påstandene, kravene og `blir`, konfigfilene mot skjemaet fra Neo, samme objekt to steder, og mønstrene. Bygget fra `check/` i dette repoet; endres der |
| `scripts/check-setup.mjs` | Hva hver plugin som er på, trenger i config-fila, også referansene under `<system>.hemmeligheter`, og hva som mangler |
| `scripts/vis-hemmeligheter.mjs` | Referansene til hvelvet i config-fila og i personaene, og om personen når dem. Aldri verdier |
| `scripts/lib/config.mjs` | Neo for repoet: adressen, org-en, MCP-serveren og om den står i `.mcp.json` |

```bash
node scripts/sjekk.mjs [--base <ref>] [--annotate] [--summary] [--json]   # hele sjekken; rødt gir exit 1
node scripts/sjekk.mjs regler [--losning <navn>]                          # mønstrene, med det som ikke er vurdert
node scripts/sjekk.mjs filer [--losning <navn>] [--json | --stier]        # konfigfilene i rekkefølgen Neo skriver dem
node scripts/sjekk.mjs hos-kunden                                         # lista over det kunden må gjøre
node scripts/sjekk.mjs --versjon
```

## Dokumentasjonen

| Fil | Hva |
|---|---|
| [`docs/monstre/`](docs/monstre/README.md) | Mønstrene for god konfig: grunnreglene, og reglene per flate med beslutningstabellene |
| [`docs/hvelvet.md`](docs/hvelvet.md) | Hvelvet: oppgavene, navnene, og formen på referansene i repoet |
| [`docs/esignering.md`](docs/esignering.md) | eSignering hos Digdir |

## Config

| Nøkkel | Hva |
|---|---|
| `neo.url` | Adressen til Neo. Skjemaet for konfigfilene hentes derfra |
| `neo.org` | Org-en med sandkassen konfigen skrives til |
| `neo.mcpServer` | Navnet på MCP-serveren i `.mcp.json` |
