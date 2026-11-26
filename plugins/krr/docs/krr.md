# Kontakt- og reservasjonsregisteret

Neo slår opp kontaktinformasjonen og reservasjonen til innbyggere i Kontakt- og reservasjonsregisteret (KRR) før
varsling. Oppslaget bruker kundens KRR-klient i [Maskinporten](../../maskinporten/docs/maskinporten.md).

Tilgangen har egen behandlingstid hos Digdir. Start med en gang.

## Oppgavene

### Søk om tilgang til registeret

1. Send informasjonsskjemaet for Kontakt- og reservasjonsregisteret til Digdir.
2. Begrunn bruken etter retningslinjene.
3. Godkjenn bruksvilkårene.
4. Gjennomfør en ROS-analyse.

Ferdig når Digdir har gitt tilgangen.

### Legg scopene på KRR-klienten

Legg disse på KRR-klienten i Maskinporten når tilgangen er gitt:

- `krr:global/kontaktinformasjon.read`
- `krr:global/digitalpost.read`

Ferdig når «Hent status» i Neo viser at scopene er på klienten.

### Registrer et varslingspunkt

Registrer et varslingspunkt hos Digdir.

Ferdig når varslingspunktet er registrert.

## Det som legges i hvelvet

Klient-ID-ene til KRR-klienten, se [Maskinporten](../../maskinporten/docs/maskinporten.md#det-som-legges-i-hvelvet):
`maskinporten-krr-test-client-id` og `maskinporten-krr-prod-client-id`.

## Det forvalteren gjør i Neo

Registrerer KRR-klienten i Neo, se [Maskinporten](../../maskinporten/docs/maskinporten.md#det-forvalteren-gjør-i-neo).

## Slik prøves det

«Hent status» i Neo for KRR-klienten. «Virksomheten har ikke tilgang» betyr at Digdir ikke har gitt tilgangen ennå.
