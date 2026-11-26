# forvaltning

Oppsettet i Neo som filer i et repo, endret med PR og godkjent av kunden. Brukes i et repo laget fra
[`neo-forvaltning-mal`](https://github.com/Neo-Systems-AI/neo-forvaltning-mal).

| Skill | Hva | Endrer Neo |
|---|---|---|
| `forvaltning:oppstart` | Setter opp repoet fra malen, med sandkassen og produksjonen, eller skrur på en plugin til | nei |
| `forvaltning:snapshot` | Henter det som kjører, som filer Neo skriver (`export_config`) | nei |
| `forvaltning:plan` | Neo prøver hver fil i sandkassen uten å lagre, og sier hva den vil gjøre (`plan_config`), til PR-en | nei |
| `forvaltning:gjennomfor` | Gjør en godkjent plan i sandkassen, én fil om gangen (`apply_config`) | ja, i sandkassen |
| `forvaltning:hemmeligheter` | Referansene til hvelvet i config-fila og i personaene, og om du når dem (aldri verdier) | nei |
| `forvaltning:env` | Hva hver plugin som er på, trenger i config-fila, og hva som mangler | nei |

Alt går gjennom Neo sin MCP-server, med personens egen innlogging, og Neo gjør arbeidet: Neo skriver filene, med
nøkler i stedet for id-er, sammenligner dem med sandkassen, prøver skrivingen og skriver hver fil i én transaksjon.
Formatet (`neo-config/v1`) og rekkefølgen står i Neo sitt manifest (`<adresse>/api/config/schema`), ikke her.
Skriptene i `scripts/` flytter bare svarene mellom Neo og repoet. De er deterministiske og har ingen avhengigheter:

- `skriv-eksport.mjs` legger svaret fra `export_config` ut som filer, fjerner det Neo ikke lenger har, og skriver
  `ikke-med.md`.
- `rekkefolge.mjs` sorterer filene i oppsettet i rekkefølgen fra manifestet.
- `planrapport.mjs` setter sammen planen av svarene fra `plan_config` og `config_not_in_files`, og sjekker før
  gjennomføringen at planen er den som ble godkjent.
- `miljo-nokler.mjs` finner integrasjonene og postboksene flytene i oppsettet er bundet til, så
  `check_config_refs` kan si om produksjonen har dem før promoteringen.

Repoet og config-fila:

- `sjekk.mjs` er sjekken av repoet: strukturen for typen i `kunde.yaml`, kildene på endringen, påstandene, kravene og
  `blir`, at filene i `oppsett/` og `snapshots/` er Neos filer, personaene, testene og avvikene i `design/`. Den er
  bygget fra `check/` i dette repoet, og malens CI henter den samme fila i en låst versjon. Innholdet i konfigfilene
  vurderer Neo i planen.
- `check-setup.mjs` viser hva hver plugin som er på, trenger i `.claude/neo.config.json`, og hva som mangler.
- `vis-hemmeligheter.mjs` viser referansene til hvelvet og om personen når dem, aldri verdiene. Skriptene som trenger
  en verdi, henter den fra hvelvet ved hvert kall med personens egen innlogging, så ingen verdi ligger på disk.
- `lib/neo-config.mjs` er config-fila: `--miljo [<miljø>]` gir MCP-serveren og adressen, og `--get <nøkkel>` en
  verdi med pluginens standard.

```bash
node scripts/sjekk.mjs [--base <ref>] [--annotate] [--summary] [--json]   # hele sjekken; rødt gir exit 1
node scripts/sjekk.mjs hos-kunden                                         # lista over det kunden må gjøre
node scripts/sjekk.mjs --versjon
```

Formen på en referanse til hvelvet og navnene der står i [`docs/hvelvet.md`](docs/hvelvet.md).
