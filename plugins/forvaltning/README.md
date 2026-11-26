# forvaltning

Oppsettet i Neo som filer i et repo, endret med PR og godkjent av kunden. Brukes i et repo laget fra
[`neo-forvaltning-mal`](https://github.com/Neo-Systems-AI/neo-forvaltning-mal).

| Skill | Hva | Endrer Neo |
|---|---|---|
| `forvaltning:oppstart` | Setter opp repoet og maskinklienten, eller skrur på en plugin til | nei |
| `forvaltning:snapshot` | Henter sandkassens oppsett som filer Neo skriver | nei |
| `forvaltning:plan` | Neo prøver alle filene samlet i sandkassen uten å lagre, og sier hva hver vil gjøre, til PR-en | nei |
| `forvaltning:gjennomfor` | Gjør en godkjent plan i sandkassen, fil for fil | ja, i sandkassen |
| `forvaltning:hemmeligheter` | Hvilke hemmeligheter som trengs, hvor de ligger, og om de er satt (bare navn) | nei |
| `forvaltning:env` | Viser config-fila slik pluginen leser den | nei |

Snapshot, plan og gjennomføring går med `scripts/konfig.mjs`, som kaller Neo sitt API (`/api/config/*`) med en
maskinklient i sandkassen (`neo.byEnv.sandkasse.apiClient`), uten MCP og uten at svarene går gjennom modellen. Neo gjør
arbeidet: skriver filene, med nøkler i stedet for id-er, prøver skrivingen i sandkassen, og skriver hver fil i én
transaksjon. Formatet (`neo-config/v1`) og rekkefølgen står i Neo sitt manifest (`<adresse>/api/config/schema`), ikke
her. Produksjonen endres bare ved promotering i Neo, og forhåndsvisningen der viser hva som mangler.

Skriptene i `scripts/` er deterministiske og har ingen avhengigheter:

- `konfig.mjs` er kommandoen: `token`, `miljo`, `export`, `plan` (alle filene, eller `--fil` for én) og `apply`.
- `lib/neo-api.mjs` (fra `shared/neo-kall/`) henter token med maskinklienten og kaller Neo. Hemmeligheten leses fra
  miljøet eller `.env.local`, aldri fra config-fila.
- `skriv-eksport.mjs` legger eksporten ut som filer, fjerner det Neo ikke lenger har, og skriver `ikke-med.md`.
- `planrapport.mjs` setter sammen planen av Neo sine svar, og sjekker før gjennomføringen at planen er den som ble
  godkjent.
- `hent-hemmeligheter.mjs` henter hemmelighetene fra kundens hvelv (Azure Key Vault, 1Password, eller manuelt) til
  `.env.local` og `.keys/`. Et menneske kjører hentingen.
- `vakt.mjs` er en hook som stopper agenten fra å lese `.env.local` og `.keys/`, og fra å kjøre hentingen.
