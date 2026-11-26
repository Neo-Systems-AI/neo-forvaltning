# forvaltning

Oppsettet i Neo som filer i et repo, endret med PR og godkjent av kunden. Brukes i et repo laget fra
[`neo-forvaltning-mal`](https://github.com/Neo-Systems-AI/neo-forvaltning-mal).

| Skill | Hva | Endrer Neo |
|---|---|---|
| `forvaltning:oppstart` | Setter opp repoet, eller skrur på en plugin til | nei |
| `forvaltning:snapshot` | Henter det som kjører, som filer Neo skriver (`export_config`) | nei |
| `forvaltning:plan` | Neo prøver hver fil i sandkassen uten å lagre, og sier hva den vil gjøre (`plan_config`), til PR-en | nei |
| `forvaltning:gjennomfor` | Gjør en godkjent plan i sandkassen, én fil om gangen (`apply_config`) | ja, i sandkassen |
| `forvaltning:hemmeligheter` | Hvilke hemmeligheter som trengs, hvor de ligger, og om de er satt (bare navn) | nei |
| `forvaltning:env` | Viser config-fila slik pluginen leser den | nei |

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

- `hent-hemmeligheter.mjs` henter hemmelighetene fra kundens hvelv (Azure Key Vault, 1Password, eller manuelt) til
  `.env.local` og `.keys/`. Et menneske kjører hentingen.
- `vakt.mjs` er en hook som stopper agenten fra å lese `.env.local` og `.keys/`, og fra å kjøre hentingen.
