# documaster

Rå lese-kall mot kundens Documaster-arkiv (Noark 5), til feilsøk. Den som feilsøker en flyt i Neo, skal kunne se hva
arkivet selv sier, og sette det opp mot det Neo gjorde: ble journalposten arkivert, i hvilken
mappe, og med hvilke dokumenter.

Bare lesing. Pluginen har ingen kall som oppretter, endrer eller sletter.

## Det kunden må ha selv

Kunden eier instansen, klienten og hemmeligheten. Vi eier koden.

- **En Documaster-instans**, og gjerne en egen testinstans. Documaster gir den.
- **En klient med client credentials** mot instansen: klient-ID, hemmelighet, token-adresse og scope. Documaster setter
  den opp, enten i sin egen IdP (scope `openid`) eller i kundens Entra ID (scope `api://<app-id>/.default`).
  Klienten trenger bare lesetilgang til arkivdelene feilsøket gjelder.
- **Hemmeligheten i kundens nøkkelhvelv.** Referansen står under `documaster.hemmeligheter` i config-fila i kunderepoet. Hele oppsettet hos kunden står i [`docs/documaster.md`](./docs/documaster.md).

## Oppsett

I `.claude/neo.config.json` i kundens repo, for instansen repoet arbeider mot:

```json
"documaster": {
  "apiUrl": "https://<instans>:8083",
  "tokenUrl": "https://<idp>/token",
  "clientId": "<klient-id>",
  "scope": "openid",
  "hemmeligheter": {
    "client-secret": { "$env": "DOCUMASTER_CLIENT_SECRET", "kilde": "azure-keyvault:<hvelv>/documaster-client-secret" }
  }
}
```

- **`apiUrl` er API-et, ikke nettsiden.** API-et svarer på port 8083; nettsiden på `/v2/` svarer 200 med HTML på alle
  stier, så en feil adresse ser ut som et vellykket kall. Skriptet stopper på et HTML-svar.
- **Hemmeligheten** leses fra `.env.local`, der et menneske har hentet den fra kundens hvelv
  (`/forvaltning:hemmeligheter`).

## Kallene

`scripts/documaster.mjs`, uten avhengigheter (Node 22). Alle går mot `POST /rms/api/public/noark5/v1/query` etter et
token med client credentials.

| Kommando | Spørring | Bevist |
|---|---|---|
| `token` | token-kallet alene | test |
| `arkivdeler` | `Arkivdel` | test |
| `mappe <id>` / `--saksnummer` | `AbstraktMappe`, `id` / `mappeIdent` | formen produktet bruker |
| `registrering <id>` / `--ident` | `AbstraktRegistrering`, `id` / `registreringsIdent` | formen produktet bruker |
| `journalpost <id>` | `Journalpost`, `id` | formen produktet bruker |
| `registreringer --mappe` / `--saksnummer` | `AbstraktRegistrering`, `refMappe.id` / `refMappe.mappeIdent` | formen produktet bruker |
| `dokumenter --registrering` | `Dokumentversjon`, `refDokument.refRegistrering.id` | formen produktet bruker |
| `sok --type … [--query … --param …]` | fritt | — |

Hver kjøring skriver miljøet, spørringen, `POST <adresse> → <status> (<ms>)` og svaret, med hemmeligheten og tokenet
sladdet. Exit 0 ved 2xx, 1 ved feil eller ikke-2xx, 2 ved feil bruk. Skillen `documaster` sier hvordan svaret leses i
et feilsøk.

```bash
node --test plugins/documaster/scripts/*.test.mjs
```
