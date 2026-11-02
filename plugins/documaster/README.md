# documaster

Rå lese-kall mot kundens Documaster-arkiv (Noark 5), til feilsøk. Den som feilsøker en flyt i Neo, skal kunne se hva
arkivet selv sier, og sette det opp mot det Neo gjorde (`/helse:feilsok`): ble journalposten arkivert, i hvilken
mappe, og med hvilke dokumenter.

Bare lesing. Pluginen har ingen kall som oppretter, endrer eller sletter.

## Det kunden må ha selv

Kunden eier instansen, klienten og hemmeligheten. Vi eier koden.

- **En Documaster-instans**, og gjerne en egen testinstans. Documaster gir den.
- **En klient med client credentials** mot instansen: klient-ID, hemmelighet, token-adresse og scope. Documaster setter
  den opp, enten i sin egen IdP (scope `openid`) eller i kundens Entra ID (scope `api://<app-id>/.default`).
  Klienten trenger bare lesetilgang til arkivdelene feilsøket gjelder.
- **Hemmeligheten i kundens nøkkelhvelv.** Config-fila sier bare hvor den ligger.

## Oppsett

I `.claude/neo.config.json` i kundens repo:

```json
{
  "version": 1,
  "documaster": {
    "environments": ["test", "produksjon"],
    "defaultEnv": "test",
    "byEnv": {
      "test": {
        "apiUrl": "https://<instans>:8083",
        "tokenUrl": "https://<idp>/token",
        "clientId": "<klient-id>",
        "clientSecret": { "$env": "DOCUMASTER_TEST_CLIENT_SECRET", "kilde": "azure-keyvault:<hvelv>/<navn>" },
        "scope": "openid"
      }
    }
  }
}
```

- **`apiUrl` er API-et, ikke nettsiden.** API-et svarer på port 8083; nettsiden på `/v2/` svarer 200 med HTML på alle
  stier, så en feil adresse ser ut som et vellykket kall. Skriptet stopper på et HTML-svar.
- **Hemmeligheten** hentes til `.env.local` av et menneske: `/forvaltning:hemmeligheter`. Den committes aldri.
- **Sjekk oppsettet** med `/documaster:env`.

## Kallene

`scripts/documaster.mjs`, uten avhengigheter (Node 22). Alle går mot `POST /rms/api/public/noark5/v1/query` etter et
token med client credentials.

| Kommando | Spørring | Bevist |
|---|---|---|
| `token` | token-kallet alene | i labben |
| `arkivdeler` | `Arkivdel` | i labben |
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
