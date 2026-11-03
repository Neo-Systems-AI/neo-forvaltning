---
name: altinn-kall
description: Rå lese-kall mot Altinn 3 til feilsøk - hvilken status har instansen, hvor står prosessen, hvilke data-elementer og hvilke hendelser kom. Brukes sammen med /helse:feilsok for å sette det Altinn sier opp mot det Neo gjorde. Bare lesing, med kundens Maskinporten-klient.
---

# Altinn 3: hva Altinn selv sier

Last denne når en flyt i Neo henter, mottar eller reagerer på et Altinn-skjema, og du må vite hva Altinn har. Neo
sier hva den gjorde (`/helse:feilsok`); dette skriptet sier hva Altinn har.

```bash
A="${CLAUDE_PLUGIN_ROOT}/scripts/altinn.mjs"
node "$A" token                                   # virker klienten? Claims og scopes, aldri tokenet
node "$A" instanser [--app <org>/<app>] [--ko]    # Storage-søk; --ko = arkivert og ikke kvittert
node "$A" instans <part>/<guid>                   # instansdokumentet: status, prosess, data, kvitteringer
node "$A" prosess <part>/<guid> [--historikk]     # hvor prosessen står, eller hele løpet
node "$A" data <part>/<guid>                      # data-elementene, bare metadata
node "$A" data <part>/<guid> <dataGuid> --innhold # innholdet, bare når det trengs
node "$A" hendelser [--app <org>/<app>] --alle    # hendelsene for appen, lest til enden
node "$A" hendelser --tjenesteeier [--fra <utc>]  # tjenesteeier-endepunktet
node "$A" appmeta [--app <org>/<app>]             # applicationmetadata: datatyper, prosess
```

`--miljo tt02|produksjon` (standard `altinn.miljo`, tt02). `--app` trengs ikke når `altinn.apps` har én app.
Instans-id-en er `<part>/<guid>`, slik Altinn og Neo skriver den.

## Slik feilsøker du

1. **Hent kjøringen i Neo** (`/helse:feilsok`). Finn instans-id-en Neo fikk (`<part>/<guid>`), eller tidspunktet.
2. **Virker klienten?** `token`. Mangler `urn:altinn:org` i tokenet, svarer Storage-søket 400 og
   tjenesteeier-hendelsene 401: klienten mangler tjenesteeier-scopes. Avslag fra Maskinporten
   (`invalid_scope`, `invalid_client`) er klienten, ikke flyten. Kunden eier klienten.
3. **Instansen.** `instans <part>/<guid>`: `process.currentTask` og `process.ended` sier om den er sendt inn,
   `status.isArchived` om den er arkivert, `completeConfirmations` hvem som har kvittert. `data` lister elementene.
   - **Sendt inn, og ikke kvittert av tjenesteeieren:** Neo har ikke hentet den, eller hentet uten å kvittere.
     `instanser --ko` viser alle som venter.
   - **Kvittert:** Neo (eller en annen konsument med samme org) har hentet den. Sammenlign med kjøringen.
   - **Ikke sendt inn:** innbyggeren er ikke ferdig. Ingenting å rette i Neo.
4. **Hendelsene.** `hendelser --alle`, gjerne med `--part <n>`. `after=0` gir bare første side, og de nyeste kan
   mangle; uten `--alle` sier skriptet det. Kom hendelsen, men Neo reagerte ikke, ligger feilen i abonnementet eller
   i Neo. Kom den ikke, ligger den i Altinn eller appen.
5. **Appen.** `appmeta` når datatypene eller prosessen er det Neo ikke forstod. Mangler PDF-en (`ref-data-as-pdf`),
   se `enablePdfCreation` på skjemadatatypen: uten `true` lager appen ingen PDF, selv om datatypen står i lista.

Avgjør så hvor feilen er, slik `/helse:feilsok` sier: oppsettet, data eller produktet.

## Hvem som får tilgang

- **App-policyen avgjør**, ikke org-en i app-id-en. Org-segmentet (`<org>/<app>`) trenger ikke være lik
  `urn:altinn:org` i tokenet, og en app kan gi tilgang til flere tjenesteeiere. Et avslag leses derfor i
  `policy.xml`, ikke i app-id-en (avklart med Digdir 2026-10-12).
- **En leverandør med delegering** fra tjenesteeieren står som `supplier` i Maskinporten-tokenet, og tjenesteeieren
  som `consumer`. Med et tjenesteeier-scope setter Altinn da `urn:altinn:org` til tjenesteeierens kode. `token`
  viser begge.
- **Hendelsesabonnementer** listes per tjenesteeier-kode (`consumer`), ikke etter app-policyen.
- **Ressursregisteret:** en ressurs bærer `hasCompetentAuthority.organization` fra da den ble publisert. Bytter
  tjenesteeieren organisasjonsnummer, må ressursen publiseres på nytt, og statusen kan bli «Withdrawn». Sjekk den.

## Melding i skjemaets tråd

Sender fagsystemet en melding (Correspondence) som svar på et skjema, kan den legges i skjemaets tråd i Arbeidsflate
i stedet for som et eget innslag (målt i tt02 2026-09-30):

- `externalReferences` med `DialogportenDialogId` = instansens `dataValues["dialog.id"]` (se `instans`). Meldingen
  blir en forsendelse i den dialogen som finnes. Correspondence kaller Dialogporten selv, så
  `digdir:dialogporten.serviceprovider` trengs **ikke**.
- Kravene: én mottaker, og den må være dialogens eier; ingen `replyOptions` og ingen `isConfirmationNeeded`; samme
  tjenesteeier på dialogens ressurs og meldingstjenesten. Lenker (for eksempel til en klage) går i brødteksten som
  markdown.
- `DialogportenTransmissionType` gir merkelappen (`Decision` = «Avgjørelse»).
- Kom meldingen som et eget innslag, mangler referansen eller har feil dialog-id. Avvises den, sjekk kravene over.

## Regler

- **Bare lesing.** Ingen kall som oppretter, sender, flytter prosessen, kvitterer eller sletter. Ingen skal legges
  til her; skriving gjør fagsystemet.
- **Fødselsnumre er skjult** i alt skriptet skriver (`personNumber`, `/person/…`). `--vis-person` viser dem; bruk det
  bare når feilsøket krever det.
- **Innholdet i et data-element** kan ha personopplysninger. Hent det med `--innhold` bare når metadata ikke er nok,
  vis bare det som trengs, og skriv det aldri inn i repoet.
- **Nøkkelen er kundens.** Står den ikke i `.env.local`, sier skriptet navnet og hvor den ligger. Et menneske henter
  den med `/forvaltning:hemmeligheter`; agenten gjør det aldri.
- **Produksjon** er et annet miljø med en annen klient. Si `--miljo produksjon` bare når kunden har bedt om det.
