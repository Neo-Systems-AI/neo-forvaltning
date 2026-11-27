# Henvendelse inn fra e-post og innboksen

En henvendelse kommer på e-post, via SvarInn eller fra en annen skjemaløsning. Den skal havne hos riktig person og i
riktig sak, eller bli en ny sak, uten at noen leter etter den og uten at samme innsending blir to henvendelser. Når det
er medlemmene selv som melder inn noe, gjør et skjema i Neo det samme.

## Når den passer

- **Innboksen** når kravene sier at det kommer post som ikke har fast form: e-post til postmottaket, SvarInn, en ekstern
  skjemaløsning. Agenten foreslår hva henvendelsen er (tagg), og et menneske legger den i sak.
- **Et selvbetjent skjema i Neo** når det er medlemmene som melder inn noe som skal bli en sak.

Den passer ikke for søknader fra innbyggere og virksomheter i Altinn; da er det
[Søknad inn fra Altinn](soknad-inn-fra-altinn.md).

## Klossene

E-post, SvarInn eller ekstern løsning → henvendelse i innboksen med tagg → tildeling → «Legg i sak». Eventuelt: strøm på
`inbox_item.created` → flyt. Selvbetjent skjema → flyt → sak.

- Postboksen koblet til organisasjonen
- Taggene med kjennetegn
- Feltene på henvendelsen
- Flyten for en ekstern løsning, og flyten på innkommende post
- Det selvbetjente skjemaet og flyten som oppretter saken

## Slik bygges den

1. **Velg kanalen** for hvert slag henvendelse: innboksen for det som ikke har fast form, et selvbetjent skjema for
   medlemmene.
   Regler: `../monstre/10-skjema-og-innboks.md#innboks-for-det-ustrukturerte`,
   `../monstre/10-skjema-og-innboks.md#neo-skjema-er-intern-inngang`
   Blir: `design/`
2. **Koble den felles postboksen** til organisasjonen.
   Regler: `../monstre/11-integrasjoner.md#postboks-felles-for-saksbehandlingen`
   Blir: steg i Neo: koble postboksen
3. **Koble en ekstern løsning** med «Webhook mottatt» og «Opprett henvendelse», med løsningens egen id.
   Regler: `../monstre/10-skjema-og-innboks.md#innboks-for-det-ustrukturerte`, `../monstre/07-flyt.md#flyt-ekstern-id`
   Blir: `oppsett/workflows/`
4. **Lag taggene** for hvert slag henvendelse, med kjennetegn, og la et menneske verifisere KI-forslagene først.
   Regler: `../monstre/10-skjema-og-innboks.md#tagg-ruter-ikke-sak`,
   `../monstre/10-skjema-og-innboks.md#tagg-beskrivelse-er-kjennetegn`,
   `../monstre/10-skjema-og-innboks.md#tagg-verifiseres-forst`, `../monstre/10-skjema-og-innboks.md#tagg-farge-etter-alvor`
   Blir: `oppsett/inbox-tags/`
5. **Lag felt på henvendelsen** bare for det mottaket trenger.
   Regler: `../monstre/05-felt-og-saksdata.md#henvendelsesfelt-for-mottaket`
   Blir: `oppsett/custom-fields/`
6. **Tildel og legg i sak.** Henvendelsen tildeles én person, som legger den i saken den gjelder eller oppretter en ny.
   Regler: `../monstre/10-skjema-og-innboks.md#tildel-en-person`,
   `../monstre/10-skjema-og-innboks.md#legg-i-sak-er-overgangen`
   Blir: steg i Neo: saksbehandleren tildeler og legger i sak i innboksen
7. **Automatiser det som kan** med en flyt på innkommende post, gjennom en strøm på `inbox_item.created`, eller på en tagg
   et menneske setter.
   Regler: `../monstre/07-flyt.md#flyt-epost-inn-er-en-hendelse`, `../monstre/07-flyt.md#flyt-ikke-start-seg-selv`,
   `../monstre/10-skjema-og-innboks.md#tagg-som-utloser`
   Blir: `oppsett/workflows/`
8. **Lag det selvbetjente skjemaet** for medlemmene, med et navn som sier hva det gjør, og en knapp som sier handlingen.
   Regler: `../monstre/10-skjema-og-innboks.md#selvbetjent-bare-for-innganger`,
   `../monstre/10-skjema-og-innboks.md#skjema-navn-og-versjon`,
   `../monstre/10-skjema-og-innboks.md#skjema-knappen-sier-handlingen`
   Blir: steg i Neo: lag og publiser skjemaet
9. **La en flyt opprette saken fra skjemaet** og skrive svarene i saken.
   Regler: `../monstre/10-skjema-og-innboks.md#skjemasvar-er-inndata`, `../monstre/07-flyt.md#flyt-saksdata-adresse`
   Blir: `oppsett/workflows/`

## Hvem gjør hva

- **Deterministisk:** en henvendelse fra en ekstern løsning, flytene på innkommende post og på en tagg, og saken fra det
  selvbetjente skjemaet.
- **Agenten** foreslår taggen på e-post og andre henvendelser. Et menneske verifiserer til taggen er til å stole på.
- **Mennesket** tildeler henvendelsen, legger den i riktig sak og setter en tagg som skal starte en flyt.

## Avhengighetene

- Krever [Grunnoppsettet for en sakstype](grunnoppsett-for-sakstypen.md).
- [Journalføring og offentlig journal](journalforing-og-offentlig-journal.md): en henvendelse fra innboksen journalføres
  når den legges i sak. Bestem hvem som oppretter saksmappen
  (`../monstre/11-integrasjoner.md#en-som-oppretter-saksmappen`).
- [Mangel og dialog med parten](mangel-og-dialog.md): svar på e-post kommer inn her.
- [Fordeling og arbeidskøer](fordeling-og-arbeidskoer.md): hvem som får henvendelsene.

## Grensene

- Altinn-kanalen i innboksen er ikke koblet til Altinn (`../monstre/10-skjema-og-innboks.md#innboks-for-det-ustrukturerte`).
- Det finnes ingen kobling mellom sakstype og skjema; «Ny sak» lager alltid en tom sak
  (`../monstre/10-skjema-og-innboks.md#neo-skjema-er-intern-inngang`).
- Neos skjemavisning krever innlogging i Neo, så skjemaet er bare for medlemmene
  (`../monstre/10-skjema-og-innboks.md#altinn-for-soknader`).
- Felt på en henvendelse følger ikke med når den legges i sak
  (`../monstre/05-felt-og-saksdata.md#henvendelsesfelt-for-mottaket`).
- En henvendelse kan ikke tildeles et team, og mottakeren får ikke varsel
  (`../monstre/10-skjema-og-innboks.md#tildel-en-person`).
- Utløseren «E-post mottatt» starter ikke (`../monstre/07-flyt.md#flyt-epost-inn-er-en-hendelse`).
- En flyt på en hendelse starter innen et minutt, ikke straks (`../monstre/07-flyt.md#flyt-hendelse-er-ikke-straks`).
