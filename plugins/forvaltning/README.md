# forvaltning

Oppsettet i Neo som filer i et repo, endret med PR og godkjent av kunden. Brukes i et repo laget fra
[`neo-forvaltning-mal`](https://github.com/Neo-Systems-AI/neo-forvaltning-mal).

| Skill | Hva | Endrer Neo |
|---|---|---|
| `forvaltning:oppstart` | Setter opp repoet fra malen og maskinklienten i sandkassen, eller skrur på en plugin til | nei |
| `forvaltning:snapshot` | Henter sandkassens oppsett som filer Neo skriver | nei |
| `forvaltning:plan` | Neo prøver alle filene samlet i sandkassen uten å lagre, og sier hva hver vil gjøre, til PR-en | nei |
| `forvaltning:gjennomfor` | Gjør en godkjent plan i sandkassen, fil for fil | ja, i sandkassen |
| `forvaltning:hemmeligheter` | Hvilke hemmeligheter som trengs, hvor de ligger, og om de er satt (bare navn) | nei |
| `forvaltning:env` | Hva hver plugin som er på, trenger i config-fila, og hva som mangler | nei |

Snapshot, plan og gjennomføring går med `scripts/konfig.mjs`, som kaller Neo sitt API (`/api/config/*`) med en
maskinklient i sandkassen (`neo.byEnv.sandkasse.apiClient`), uten MCP og uten at svarene går gjennom modellen. Neo gjør
arbeidet: skriver filene, med nøkler i stedet for id-er, prøver skrivingen i sandkassen, og skriver hver fil i én
transaksjon. Formatet (`neo-config/v1`) og rekkefølgen står i Neo sitt manifest (`<adresse>/api/config/schema`), ikke
her. Produksjonen endres bare ved promotering i Neo, og forhåndsvisningen der viser hva som mangler.

Skriptene i `scripts/` er deterministiske og har ingen avhengigheter:

- `konfig.mjs` er kommandoen: `token`, `miljo`, `export`, `plan` (alle filene, eller `--fil` for én) og `apply`.
- `lib/neo-api.mjs` (fra `shared/`) henter token med maskinklienten og kaller Neo. Hemmeligheten hentes fra
  hvelvet for kjøringen, eller fra variabelen når den er satt (i CI), aldri fra config-fila.
- `skriv-eksport.mjs` legger eksporten ut som filer, fjerner det Neo ikke lenger har, og skriver `ikke-med.md`.
- `planrapport.mjs` setter sammen planen av Neo sine svar, og sjekker før gjennomføringen at planen er den som ble
  godkjent.
- `vis-hemmeligheter.mjs` viser referansene i config-fila og om personen når dem i hvelvet, bare med navn.
- `vakt.mjs` er en hook som stopper agenten fra å hente en verdi fra hvelvet selv og fra å lese filer med
  hemmeligheter. Den er en dytt mot uhell, ikke en sperre.

Repoet og config-fila:

- `sjekk.mjs` er sjekken av repoet: strukturen for typen i `kunde.yaml`, kildene på endringen, påstandene, kravene og
  `blir`, at filene i `oppsett/` og `snapshots/` er Neos filer, at hemmelighetene bare står som referanser, personaene,
  testene og avvikene i `design/`. Den er bygget fra `check/` i dette repoet, og malens CI henter den samme fila i en
  låst versjon. Innholdet i konfigfilene vurderer Neo i planen.
- `check-setup.mjs` viser hva hver plugin som er på, trenger i `.claude/neo.config.json`, og hva som mangler.
- `lib/neo-config.mjs` er config-fila: `--miljo [<miljø>]` gir MCP-serveren og adressen, og `--get <nøkkel>` en
  verdi med pluginens standard.

```bash
node scripts/sjekk.mjs [--base <ref>] [--annotate] [--summary] [--json]   # hele sjekken; rødt gir exit 1
node scripts/sjekk.mjs hos-kunden                                         # lista over det kunden må gjøre
node scripts/sjekk.mjs --versjon
```

Formen på en referanse til hvelvet og navnene der står i [`docs/hvelvet.md`](docs/hvelvet.md).
