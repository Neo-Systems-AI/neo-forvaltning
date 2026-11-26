# Documaster: arkivet

Neo arkiverer i kundens Documaster-arkiv (Noark 5). Neo kobles til gjennom én app-registrering i kundens Entra ID,
brukt på to måter:

- **Som tjenestekonto** (`client_credentials`) når Neo arkiverer i bakgrunnen.
- **Til innlogging** (`authorization_code`) når en saksbehandler selv søker, viser eller arkiverer. Neo kaller da med
  saksbehandlerens ID-token, og Documaster ser hvem som gjør det.

Neo støtter også to app-registreringer, og Documasters egen innlogging. Da lager Documaster klientene. Oppskriften
under gjelder én registrering i kundens Entra ID.

## Oppgavene

### Bestill et testarkiv

Bestill et eget testarkiv med egne arkivdeler hos Documaster. Testene skal ikke gå mot arkivet i drift.

Ferdig når testarkivet finnes, og adressen til API-et står i hvelvet som `documaster--api-url`.

### Finn app-ID-URI-en til Documaster

Finn app-ID-URI-en til Documaster-appen i kundens Entra ID. Den gir scopet for tjenestekontoen: app-ID-URI-en
etterfulgt av `/.default`. Legg scopet i hvelvet som `documaster--scope`.

Ferdig når `documaster--scope` står i hvelvet.

### Lag app-registreringen

1. Lag én app-registrering i Entra ID.
2. Lag én client secret. Legg den i hvelvet som `documaster--client-secret`, og sett utløpsdatoen på hemmeligheten i
   hvelvet.
3. Legg på tillatelsene for innloggingen: `openid`, `profile`, `email` og `offline_access`.
4. Legg redirect-adressen fra forvalteren inn under Web.

Ferdig når `documaster--client-id` og `documaster--client-secret` står i hvelvet, og redirect-adressen er lagt inn.

### Gi Documaster klient-ID-en

Gi Documaster klient-ID-en til app-registreringen, så de godtar innloggingen fra den.

Ferdig når Documaster har bekreftet at klienten er godtatt.

### Gi tjenestekontoen tilgang i Documaster

Gi tjenestekontoen tilgang i Documaster til å:

- lese arkivstrukturen og kodelistene;
- opprette og oppdatere saksmapper, journalposter og dokumenter i arkivdelene Neo skal bruke.

Hvilke arkivdeler Neo skal bruke, avgjøres i arbeidsmøtene.

Ferdig når tilgangen er gitt i testarkivet, og i arkivet i drift før produksjonsstart.

### Kontroller arkivstrukturen

Kontroller at arkivstrukturen Neo skal bruke, finnes: arkivdeler, klassifikasjon, administrative enheter,
skjermingskoder og journalposttyper.

Ferdig når kunden har bekreftet strukturen overfor forvalteren.

## Det som legges i hvelvet

| Navn | Verdien |
|---|---|
| `documaster--api-url` | Adressen til API-et, ikke nettsiden |
| `documaster--client-id` | Application (client) ID til app-registreringen |
| `documaster--client-secret` | Client secret, med utløpsdato |
| `documaster--scope` | App-ID-URI-en til Documaster etterfulgt av `/.default` |

Tenant-ID-en er `entra--tenant-id`, se [Entra ID](../../entra/docs/entra.md#det-som-legges-i-hvelvet).

## Det forvalteren gjør i Neo

1. Legger inn integrasjonen med verdiene fra hvelvet.
2. Velger «Bruk samme app-registrering» for innloggingen, og gir kunden redirect-adressen.
3. Tester integrasjonen i Neo.

## Slik prøves det

Ferdig når testen i Neo henter token og leser arkivdelene, og en saksbehandler kan logge inn mot Documaster fra Neo.

## Når arkivet er i drift

- Client secret byttes før utløpsdatoen.
- Adressen til API-et er en annen enn nettsiden til Documaster. Den nettsiden svarer på alle stier, så en feil adresse
  kan se ut som en tilkobling som virker.
