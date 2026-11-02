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
5. **Appen.** `appmeta` når datatypene eller prosessen er det Neo ikke forstod.

Avgjør så hvor feilen er, slik `/helse:feilsok` sier: oppsettet, data eller produktet.

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
