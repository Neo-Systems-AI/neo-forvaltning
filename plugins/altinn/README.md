# altinn

Bygg og publiser Altinn Studio-apper — skjemaene innbyggere og virksomheter sender inn i Altinn — fra Claude Code, og les hva Altinn 3 selv sier når noe skal feilsøkes. Pluginen har tre deler:

- **Digdirs egne skills (vanilje).** De sju skillene bak KI-assistenten i Altinn Studio, kopiert byte-identisk fra [`Altinn/altinn-studio`](https://github.com/Altinn/altinn-studio/tree/main/src/AI/agents/agents/skills) (MIT, lisensen deres står i [`LICENSE-DIGDIR`](./LICENSE-DIGDIR)). De forklarer hvordan filene i en app skal se ut. Digdir skriver selv at de kan brukes fra Claude Code.
- **Vår egen skill, `altinn-publisering`.** Den dekker hele løpet ut til publisert i tt02, med de to kontrollskriptene Claude Code mangler. Den er skrevet etter publiseringen av `ddlabs/uttalelse` (2026-09-29) og verifisert mot fem apper som kjører i tt02.
- **Vår egen skill, `altinn-kall`.** Rå lese-kall mot Altinn 3 med kundens Maskinporten-klient, til feilsøk: instansen, prosessen, data-elementene, hendelsene og appens metadata, satt opp mot det Neo gjorde (`/helse:feilsok`). Se [Lese-kallene](#lese-kallene).

## Skillene

| Skill | Kilde | Last før du … |
|---|---|---|
| `altinn-publisering` | **egen** | lager, endrer eller publiserer en app. **Last denne først.** Den gir rekkefølgen, hva bare et menneske kan gjøre, og hvordan hvert steg kontrolleres |
| `altinn-kall` | **egen** | feilsøker hva Altinn har for en instans eller en app: status, prosess, data-elementer, hendelser |
| `env` | **egen** | lurer på hva som er satt i `.claude/neo.config.json` |
| `altinn-planning` | Digdir | gjør en endring som rører flere filer. Hvilke filer per endringstype, rekkefølge, og at en ny side trenger **både** en plass i `pages.order` og en `NavigationButtons` |
| `altinn-datamodel` | Digdir | rører `App/models/`. `model.schema.json`, `model.xsd` og `model.cs` er ett synkront sett |
| `altinn-policy` | Digdir | rører `App/config/authorization/policy.xml` |
| `altinn-resources` | Digdir | legger til eller endrer tekster, inkludert tekster som viser verdier fra datamodellen |
| `altinn-prefill` | Digdir | forhåndsutfyller fra register (person/organisasjon) via `prefill.json` |
| `altinn-expressions` | Digdir | skriver `hidden`/`required`/`readOnly`-logikk |
| `altinn-docs` | Digdir | trenger noe de andre ikke dekker. Inneholder en kuratert indeks over docs.altinn.studio (`llms.txt`) |

Hvilken versjon av Digdirs skills som er kopiert, står i [`UPSTREAM.json`](./UPSTREAM.json).

## Kontrollskriptene

Begge ligger i `skills/altinn-publisering/scripts/`, er avhengighetsfrie (Node 18+) og endrer ingenting.

| Skript | Svarer på | Exit |
|---|---|---|
| `check-app.mjs [app-rot]` | Henger filene sammen? Sjekker app-id mot repoet, metadata, at de tre modellfilene har de samme feltene, sidelisten, `NavigationButtons`, bindinger og uttrykk mot modellen, tekstnøkler og tekstvariabler, vedleggsdatatyper, kodelister og åpenbare hemmeligheter. Erstatter det `verify_changes` og `altinn_datamodel_sync` gjør i Digdirs løkke, så langt filene alene kan avgjøre det | 0 OK · 1 FEIL · 2 ikke en app-rot |
| `check-deployed.mjs [app-rot] [--env tt02\|prod] [--wait s]` | Kjører klonen i miljøet? Med `--wait` prøver den på nytt til alt stemmer, fordi en publisering ruller ut gradvis. Sammenligner app-id, datatyper, tittel, sider, komponent-id-er per side og datamodell via endepunktene appen eksponerer uten innlogging. Studio henger etter, så dette er kontrollen, ikke Studios grønne status | 0 matcher · 1 avvik eller svarer ikke · 2 feil bruk |

Verifisert: `check-app.mjs` finner ingen FEIL i `ddlabs/uttalelse`, `parkeringstillatelse`, `ettersend-info`, `generisk-klageskjema` eller `dihe-motorferdsel`, og fanger alle åtte feiltypene som ble plantet i en kopi. `check-deployed.mjs` gir OK for alle fem mot tt02, og en forklarende FEIL for en app på en personlig konto.

## Det som ikke oversettes til Claude Code

Digdirs skills er skrevet for deres agent-løkke inne i Studio:

- **Verktøyene de viser til** (`altinn_datamodel_sync`, `verify_changes`, `altinn_layout_props`) finnes ikke her. Modellfilene skrives for hånd, og `check-app.mjs` tar kryss-sjekken. Komponentegenskaper mot Altinns JSON-skjemaer valideres av Studio når appen åpnes der.
- **Versjonsfilene lastes ikke av seg selv.** `v8.md`/`v9.md` ved siden av `SKILL.md` og `include: llms.txt` må leses eksplisitt. Versjonen står i `App/App.csproj` (`Altinn.App.Core` 8.x = v8).
- **Et eksisterende app-repo er beste eksempel.** Offentlige app-repoer kan klones uten innlogging.

## Tilgang til Altinn Studio

Pluginen kobler seg **ikke** til Altinn Studio, og publiseringen trenger ingen env-variabler, brukernavn eller tokens. Den bærer bare kunnskap og lese-skript. (Lese-kallene mot Altinn 3 bruker kundens Maskinporten-klient; se [Lese-kallene](#lese-kallene).) Koblingen er vanlig git mot app-repoet, med utviklerens egen innlogging.

**Hver utvikler har sin egen bruker.** Det er ikke noe som skal deles:

- **Tilgang gis per person.** Den som administrerer tjenesteeier-org-en i Studio gir rettigheter per brukernavn, både til å opprette apper og til å publisere. Med et delt token blir alle samme identitet, og det kan ikke lenger sees hvem som publiserte hva.
- **Innlogging i Studio går via Ansattporten** (BankID eller MinID). Den kan ikke deles, og publisering skjer i Studio-grensesnittet.
- **Git-tokenet er personlig.** Det brukes som passord ved klon og push, og lagres i maskinens nøkkelring, aldri i en `.env`-fil.

Oppsett for en ny utvikler:

1. Logg inn på [altinn.studio](https://altinn.studio) med Ansattporten.
2. Finn brukernavnet ditt på <https://altinn.studio/repos/user/settings>, og send det til den som administrerer org-en. Be om rettighet til å opprette apper og publisere.
3. Lag et token under *Innstillinger → Applikasjoner → Generer nytt token*, med lese- og skrivetilgang til repository.
4. La git huske tokenet (macOS), og klon appen. Oppgi brukernavnet, og lim inn tokenet der den ber om passord:

   ```bash
   git config --global credential.helper osxkeychain
   git clone https://altinn.studio/repos/<org>/<app>.git
   ```

5. Installer pluginen: `/plugin marketplace add Neo-Systems-AI/neo-forvaltning` og `/plugin install altinn@neo-forvaltning`, og start økten på nytt.

**Uten bruker kan man fortsatt lese.** Offentlige app-repoer kan klones uten innlogging, og `check-deployed.mjs` trenger ingen innlogging. Bare push og publisering krever bruker.

**Maskinporten er noe annet.** Identiteten et fagsystem bruker mot Altinn når det kjører (opprette instanser, lese innsendinger, sende meldinger), hører til fagsystemet og konfigureres der. Den har ingenting med publiseringen eller utviklernes Studio-brukere å gjøre. Lese-kallene under bruker en Maskinporten-klient kunden eier.

## Arbeidsflyt og publisering

Står i [`skills/altinn-publisering/SKILL.md`](./skills/altinn-publisering/SKILL.md), som er den ene kilden for løpet, så agenten og mennesket leser det samme. Kort fortalt:

1. Tom app i Studio, helst direkte med org-en som eier.
2. Klon og bygg etter en app som kjører.
3. `check-app.mjs`, så commit og push.
4. Forhåndsvis i Studio.
5. Eventuelt *Lag kopi* til org-en.
6. Fyll ut metadata.
7. Bygg og publiser.
8. `check-deployed.mjs`.
9. Et menneske tester innsending med en syntetisk testbruker.

## Lese-kallene

`scripts/altinn.mjs`, uten avhengigheter (Node 22), brukt av skillen [`altinn-kall`](./skills/altinn-kall/SKILL.md). Bare lesing: ingen kall som oppretter, sender, flytter prosessen, kvitterer eller sletter.

**Tokenet.** Et Maskinporten-token for kundens klient (JWT-grant) veksles til et Altinn-token med `GET /authentication/api/v1/exchange/maskinporten` på plattform-verten. Altinn-tokenet brukes mot Storage, app-API-et og Events.

| Kommando | Endepunkt | Bevist |
|---|---|---|
| `token` | Maskinporten, så vekslingen | i labben (tt02) |
| `instanser [--app \| --org] [--part] [--ko] [--antall]` | `GET <plattform>/storage/api/v1/instances?appId=…` | i labben (tt02) |
| `instans <part>/<guid>` | `GET <plattform>/storage/api/v1/instances/{part}/{guid}` | i labben (tt02) |
| `data <part>/<guid>` | instansdokumentets `data`, bare metadata | i labben (tt02) |
| `data <part>/<guid> <dataGuid> --innhold` | `GET <plattform>/storage/api/v1/instances/{part}/{guid}/data/{dataGuid}` | i labben (tt02) |
| `prosess <part>/<guid> [--historikk]` | `GET https://<org>.apps.<miljø>/<org>/<app>/instances/{part}/{guid}/process[/history]` | i labben (tt02) |
| `hendelser [--alle]` | `GET <plattform>/events/api/v1/events?resource=urn:altinn:resource:app_<org>_<app>&after=…` | i labben (tt02) |
| `hendelser --tjenesteeier` | `GET <plattform>/events/api/v1/app/{org}/{app}` | i labben (tt02) |
| `appmeta` | `GET https://<org>.apps.<miljø>/<org>/<app>/api/v1/applicationmetadata` | i labben (tt02) |

Plattform-verten er `platform.tt02.altinn.no` i tt02 og `platform.altinn.no` i produksjon. Produksjon er ikke prøvd.

Hver kjøring skriver miljøet, `GET <adresse> → <status> (<ms>)` og svaret, med tokenene og hemmelighetene sladdet. **Fødselsnumre er skjult** (`personNumber`, `/person/…`) med mindre `--vis-person` er sagt, og innholdet i et data-element hentes bare med `--innhold`. Exit 0 ved 2xx, 1 ved feil eller ikke-2xx, 2 ved feil bruk.

**Det kunden må ha selv.** Kunden eier klienten og nøkkelen; vi eier koden.

- **En Maskinporten-klient per miljø** (test-Maskinporten for tt02, Maskinporten for produksjon), registrert på kundens organisasjonsnummer, med tjenesteeier-scopes for Altinn. For lesing: `altinn:serviceowner/instances.read`, og for hendelsene `altinn:serviceowner/events` og `altinn:events.subscribe`. Maskinporten avviser hele kallet om klienten mangler ett scope, så `scopes` settes til dem klienten har.
- **Kunden er tjenesteeier i Altinn** (akronymet i `org`), ellers får tokenet ikke `urn:altinn:org`, og Storage svarer 400.
- **Nøkkelen i kundens nøkkelhvelv.** Config-fila sier bare hvor den ligger; et menneske henter den til `.keys/` med `/forvaltning:hemmeligheter`.

I `.claude/neo.config.json`:

```json
{
  "version": 1,
  "altinn": {
    "org": "ttd",
    "apps": ["ttd/<app>"],
    "environments": ["tt02", "produksjon"],
    "byEnv": {
      "tt02": {
        "maskinporten": {
          "clientId": "<klient-id>",
          "nokkel": { "$env": "ALTINN_TT02_MASKINPORTEN_NOKKEL", "kilde": "azure-keyvault:<hvelv>/<navn>", "fil": true },
          "scopes": ["altinn:serviceowner/instances.read", "altinn:serviceowner/events", "altinn:events.subscribe"]
        }
      }
    }
  }
}
```

`kid` er valgfri (uten den brukes thumbprinten til nøkkelen), og `subscriptionKey` settes bare om kunden har fått en. Miljøene og Maskinporten-nøklene trengs bare til lese-kallene, ikke til publiseringen. Sjekk oppsettet med `/altinn:env`.

```bash
node --test plugins/altinn/scripts/*.test.mjs
```

## Oppdatere Digdirs skills

```bash
node plugins/altinn/scripts/sync-skills.mjs --ref main   # hent siste versjon og lås sha-en
node plugins/altinn/scripts/sync-skills.mjs --check      # har kopien driftet? exit 1 ved avvik
```

Digdirs skills redigeres **aldri** her. En lokal endring gjør neste synk til en merge framfor en kopi, og `--check` melder den som avvik. Synken rører bare Digdirs mapper: våre egne (`OWN_SKILLS` i skriptet, i dag `altinn-publisering`) blir stående, og synken stopper hvis Digdir en dag får en skill med samme navn som en av våre.
