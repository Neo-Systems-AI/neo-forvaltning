---
name: altinn-publisering
description: Hele løpet for en Altinn Studio-app, fra tom app til publisert i tt02, i Claude Code. Det dekker tilgang, mal, bygging med Digdirs skills, kryss-sjekk, forhåndsvisning, kopi til tjenesteeier-org-en, metadata, bygg og publisering, og kontroll mot miljøet. Last først når en app skal lages, endres eller publiseres.
---

# Altinn-app fra start til publisert

Dette er løpet som ble brukt og verifisert da `ddlabs/uttalelse` ble publisert i tt02 (2026-09-29). Digdirs skills (`altinn-planning`, `altinn-datamodel`, `altinn-resources`, `altinn-expressions`, `altinn-policy`, `altinn-prefill`, `altinn-docs`) forklarer *hvordan filene skal se ut*. Denne skillen forklarer *rekkefølgen, hva som bare et menneske kan gjøre, og hvordan hvert steg kontrolleres* i Claude Code.

Skriptene nevnt under ligger i `scripts/` ved siden av denne fila. Kjør dem med full sti fra skillens mappe.

## 0. Hvem gjør hva

| Steg | Agent | Menneske |
|---|---|---|
| Studio-bruker, org-tilgang, git-token | | ✅ (Ansattporten kan ikke deles, tokens håndteres aldri av agenten) |
| Opprette tom app | | ✅ (Studio har ingen API eller CLI for dette i dag) |
| Klone, bygge, kryss-sjekke, committe | ✅ | |
| Pushe | ✅ hvis git allerede har innloggingen i nøkkelringen, ellers gir agenten kommandoen | ✅ |
| Forhåndsvise i Studio | kan, i en nettleser mennesket er logget inn i | ✅ |
| Kopi til org, bygg, publiser | kan, i en nettleser mennesket er logget inn i, når mennesket har bedt om det | ✅ |
| Kontroll mot miljøet | ✅ `check-deployed.mjs` | |
| Sende inn med testbruker | ❌ agenten logger aldri inn med en testbruker | ✅ |

## 1. Tilgang (én gang per utvikler)

- Hver utvikler har sin **egen** bruker på altinn.studio, med innlogging via Ansattporten. Brukernavnet står på <https://altinn.studio/repos/user/settings>.
- Den som administrerer tjenesteeier-org-en, gir tilgang per brukernavn til å opprette og publisere.
  - I en delt org kan skrivetilgangen være smal. I Digdir Labs (`ddlabs`) kan du bare pushe til apper du selv har laget. Andres apper kan leses og redigeres i Studio, men ikke pushes.
- Git bruker et personlig token (*Innstillinger → Applikasjoner*) som passord, lagret i nøkkelringen (`git config --global credential.helper osxkeychain`). **Aldri** i env, i en fil eller i chatten.
- Stopper `git clone` eller `git push` på innlogging (`could not read Username`): stopp og gi mennesket kommandoen. Ikke be om tokenet.

## 2. Lag appen og finn en mal

1. Mennesket oppretter en tom app i Studio, helst **direkte med org-en som eier**. Da slipper du kopisteget i punkt 6. Navnet blir app-id-en (`<org>/<navn>`) i alle URL-er og API-er, og det kan ikke endres.
2. Klon den: `git clone https://altinn.studio/repos/<org>/<app>.git`.
3. **Finn versjonen** i `App/App.csproj` (`Altinn.App.Core` 8.x = v8, 9.x = v9). Les `v8.md`/`v9.md` ved siden av Digdirs `SKILL.md`-filer eksplisitt. De lastes ikke av seg selv i Claude Code.
4. **Klon en app som kjører**, i samme org og på samme versjon, og bruk den som mal. Offentlige app-repoer i en org kan klones uten innlogging. Den viser komponentoppsett, tilgangsregler og konvensjoner for datamodellen som faktisk virker, og den slår en beskrivelse. Til komponenteksempler: `https://altinn.studio/repos/ttd/component-library.git`.

## 3. Bygg

Følg Digdirs skills i denne rekkefølgen: `altinn-planning` → `altinn-datamodel` → `altinn-resources` → `altinn-expressions` → `altinn-policy` → `altinn-prefill` (bare ved registerutfylling) → `altinn-docs` (for resten).

Det skillene forutsetter at et verktøy gjør, gjør du selv:

- **Datamodellen** (`altinn_datamodel_sync` finnes ikke): skriv `model.schema.json`, `model.xsd` og `model.cs` for hånd, med de samme feltene i samme rekkefølge. Digdirs egne apper holder alt valgfritt i modellen (`minOccurs="0"`) og styrer påkrevde felt med `required` i sidene. Oppramsinger er `enum` i skjemaet, en `xs:simpleType`-restriksjon i XSD-en og `string` i C#.
- **Validering** (`verify_changes` finnes ikke): kjør `scripts/check-app.mjs <app-rot>` etter hver endring (se punkt 4).
- **Komponentegenskaper** (`altinn_layout_props` finnes ikke): kopier fra malen, og hold deg til `$schema` i fila.

### Når et fagsystem (for eksempel Neo) oppretter og leser instansene

- **Hendelser må skrus på:** en ny app fra Studio har `AppSettings.RegisterEventsWithEventsComponent = false` i `App/appsettings.json`. Da sender appen **ingen** hendelser, heller ikke `app.instance.created` eller `app.instance.process.completed`. Fagsystemet får aldri vite at noe er sendt inn, og ingenting feiler. Sett den til `true`. Målt på `ddlabs/uttalelse` 2026-09-29: abonnementet var gyldig, men events-API-et var tomt, og svaret nådde aldri Neo. Hendelser for instanser som allerede er sendt inn, kommer ikke i ettertid. `check-app.mjs` advarer når den er av.
- **Tilgangsregler:** tjenesteeieren må ha `read`, `write`, `instantiate`, `events` og `complete` gjennom regelen med `[ORG]`. Kopier `policy.xml` fra en nyere app i org-en som har dette. **Aldri** legg inn orgnumre: `urn:altinn:org` er eier-akronymet, og orgnummer-regler i eldre apper viser seg å være rester.
- **Forhåndsutfylling ved opprettelse:** nøklene kan være stier (`foresporsel.tittel`). Altinn splitter på `.` og lager objektene som mangler. Men ekstern forhåndsutfylling kjøres med `continueOnError = true` (app-lib v8, `PrefillSI.cs`), så en nøkkel som ikke finnes i modellen, **droppes uten feil**. Fagsystemets test må derfor sjekke at verdien står i `model` etter opprettelse, ikke bare at kallet ga 201.
- **Tomme forhåndsutfylte felt skjules** med `hidden` (`["or", ["equals", ["dataModel", "x"], null], ["equals", ["dataModel", "x"], ""]]`), så skjemaet virker også uten forhåndsutfylling, både i forhåndsvisningen og ved manuell start.
- **`disallowUserInstantiation: true`** sørger for at bare fagsystemet kan starte appen. Da virker trolig ikke forhåndsvisningen i Studio. Det er et valg mennesket tar, og det må nevnes.
- **Vedlegg:** komponent-id-en til `FileUpload` *er* datatype-id-en. Fagsystemet leser vedlegg og PDF (`ref-data-as-pdf`) som egne dataelementer.
- **PDF-en lages bare med `enablePdfCreation: true`** på skjemadatatypen (`model` eller det den heter). At `ref-data-as-pdf` står i `dataTypes`, betyr ikke at appen lager PDF. Sett feltet når fagsystemet skal hente PDF-en, og kontroller det med `appmeta` i `altinn-kall` og en faktisk instans. Målt 2026-10-19: Digdirs generiske testapp `ettersend-info` har `false` på alle datatyper, og ingen av instansene har PDF. Trenger du annen oppførsel i en app du ikke eier, lag en egen kopi (punkt 7).

## 4. Kryss-sjekk før commit

```bash
node <skill-mappe>/scripts/check-app.mjs <app-rot>
```

Den sjekker det som kan avgjøres fra filene alene, og avslutter med exit 1 ved FEIL:

- at app-id-en stemmer med repoet
- metadatafeltene fra punkt 5
- at de tre modellfilene har de samme feltene
- sidelisten mot sidefilene, og `NavigationButtons` på hver side
- at hver binding og hvert uttrykk treffer et felt i modellen
- at hver tekstnøkkel finnes, og at tekstvariablene treffer modellen
- at vedleggskomponentene har en datatype
- at kodelistene finnes
- åpenbare hemmeligheter

Den validerer **ikke** komponentegenskaper mot Altinns JSON-skjemaer. Det gjør Studio når appen åpnes der. Si det, ikke påstå at appen er «validert».

Skriptet er kjørt mot `ddlabs/uttalelse`, `parkeringstillatelse`, `ettersend-info`, `generisk-klageskjema` og `dihe-motorferdsel`, som alle kjører i tt02, uten én FEIL. Et funn betyr derfor noe.

## 5. Metadata (kreves for publisering i en delt org)

I `App/config/applicationmetadata.json`:

- `title` og `description`, begge på `nb`, `nn` og `en`
- `contactPoints`. Et eksempel som fungerer for alle tjenester i en org:

```json
"contactPoints": [
  { "category": "https://altinn.studio/info/contact", "email": "", "telephone": "", "contactPage": "Kontakt oss" }
]
```

**Alt i en delt org kan leses av alle som er logget inn i Studio**, og publiserte apper kan brukes av alle i miljøet. Ingen hemmeligheter, ingen ekte person- eller orgnumre i koden eller i konfigurasjonen.

## 6. Commit, push, forhåndsvis

- Commit med en melding som forklarer *hvorfor*. Push går til `master`.
- **Forhåndsvisning** i Studio: *Hent endringer* først, så *Forhåndsvis*. Forhåndsvisningen kan ikke forhåndsutfylle data, så felt som fagsystemet fyller ut, er tomme der. Det er forventet, ikke en feil.

## 7. Kopi til tjenesteeier-org-en (bare hvis appen ble laget på egen konto)

Bare en app med org-en som eier får *Publiser* i toppmenyen. En app på egen konto kan forhåndsvises, men aldri publiseres. `check-deployed.mjs` sier fra hvis eieren ikke har et miljø.

På <https://altinn.studio/dashboard>: menyen (⋮) helt til høyre på appens rad → *Lag kopi* → *Eier* = org-en → *Navn* = endelig app-navn → *Lag kopi*. Studio skriver om `id` og `org` i metadata, og git-historikken blir med. **Klon kopien.** Det er den som publiseres, og videre endringer går dit, ikke til den gamle klonen.

## 8. Bygg og publiser (under *Publiser*)

1. **Bygg versjon:** versjonsnummer og beskrivelse. Bygget tar siste commit på `master`, så push først.
   - **Versjonsfeltet godtar ikke punktum.** `1.0.0` ble lagret som `100`. Bruk heltall (`1`, `2`, …).
   - Bygget tar et par minutter, og siden oppdaterer seg ikke alltid. Last den inn på nytt.
   - I en automatisert nettleser kan tegn falle ut av tekst du skriver (`uttalelse` ble `uttallse`). Les beskrivelsen etter at den er skrevet, og skriv den inn på nytt hvis den er feil.
2. **Publiser ny versjon:** velg versjonen → *Publiser ny versjon* → bekreft *Ja*. Publisering til et miljø er en utadrettet handling: agenten gjør den bare når mennesket har bedt om publisering.

## 9. Kontroller mot miljøet, ikke mot Studio

Studio henger etter: appen svarte i tt02 flere minutter før Studio sa at den var publisert, og en grønn status sier ikke *hvilken* commit som kjører.

```bash
node <skill-mappe>/scripts/check-deployed.mjs <app-rot> --wait 300
```

Skriptet leser endepunktene appen eksponerer uten innlogging, i miljøet (default `tt02`, `--env prod` for produksjon), og sammenligner med klonen:

- app-id, datatyper og tittel
- sidene per layout-sett
- komponent-id-ene per side, som fanger en endring som ikke er publisert
- toppnivåfeltene i datamodellen

Rett etter publisering: bruk `--wait 300`. Den prøver på nytt til miljøet matcher klonen, eller til tiden er ute. En publisering ruller ut gradvis, og i et vindu svarer gammel og ny versjon om hverandre. Målt ved versjon 3 av `ddlabs/uttalelse`: tt02 serverte de nye sidene, men den gamle datamodellen, i omtrent ett minutt. Et første OK-svar, eller et avvik rett etter publisering, sier derfor ikke at versjonen er ute. Vent før du feilsøker.

Endepunktene, hvis du vil se selv: `https://<org>.apps.tt02.altinn.no/<org>/<app>/api/v1/applicationmetadata`, `/api/layouts/<layout-sett>` (svaret er JSON pakket inn som en streng), og `/api/jsonschema/<datatype>`.

## 10. Hva «ferdig» betyr

`check-deployed.mjs` OK betyr at **riktig versjon kjører**. Det betyr ikke at innsending virker. Rapporter det som gjenstår som utestet:

- **Innsending:** et menneske logger inn med en testbruker og sender inn. Agenten logger aldri inn med en testbruker.
- **Integrasjon:** fagsystemet oppretter en forhåndsutfylt instans, mottakeren svarer, og hendelsen `app.instance.process.completed` når fagsystemet. Det testes fra fagsystemets side.
- **Testdata:** mottakere er **syntetiske** testorganisasjoner og testpersoner i tt02 (Tenor/TestID), aldri ekte virksomheter eller personer. Det gjelder også når demoen «spiller» en ekte kommune.
