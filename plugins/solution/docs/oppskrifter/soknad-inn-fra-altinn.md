# Søknad inn fra Altinn

En innbygger eller virksomhet sender en søknad, en melding eller en klage i Altinn. Den skal bli en sak med riktig part,
riktige felt og grunnlaget på plass, uten at noen taster den inn, og uten at samme innsending blir to saker.

## Når den passer

Når kravene sier at noen utenfor organisasjonen skal sende noe som starter en sak: en søknad, en melding, en klage.
Inntaket er deterministisk fra hendelsen til saken.

Den passer ikke når det kommer som e-post, via SvarInn eller fra en annen skjemaløsning; da er det
[Henvendelse inn fra e-post og innboksen](henvendelse-inn-fra-epost-og-innboks.md). Svar fra parten i en sak som alt
finnes (ettersending, aksept, rapport), er [Innhenting fra parten med et Altinn-skjema](innhenting-med-altinn-skjema.md).

## Klossene

App i Altinn → hendelse i strømmen → inntaksflyten (skjemadata, oppslag, sak, part, saksdata, instans, journalpost) →
saken.

- Appen i Altinn, én per slag innsending
- Integrasjonen mot Altinn med Maskinporten-klienten, abonnementet og strømmen
- Saksdatamalen for søknaden og valgfeltene med nøkler
- Instansfeltet på saken
- Inntaksflyten med oppslagstabellen

## Slik bygges den

1. **Avtal kontrakten med appen.** Én app per slag innsending. Skriv ned app-id-en, datatypene, maskinverdiene i hvert
   valg og feltene som forhåndsutfylles.
   Regler: `../monstre/10-skjema-og-innboks.md#altinn-for-soknader`, `../monstre/11-integrasjoner.md#altinn-kontrakten`,
   `../monstre/11-integrasjoner.md#en-app-per-innsending`
   Blir: `design/`
2. **Sett opp integrasjonen mot Altinn**: Maskinporten-klienten, integrasjonen, abonnementet på appen og strømmen med én
   hendelsestype per app.
   Regler: `../monstre/11-integrasjoner.md#en-klient-mange-integrasjoner`,
   `../monstre/11-integrasjoner.md#en-app-per-innsending`
   Blir: steg i Neo: legg inn klienten og integrasjonen, opprett abonnementet og strømmen
3. **Lag saksdatamalen for søknaden**, og valgfeltene med nøkler som inntaket skal fylle.
   Regler: `../monstre/05-felt-og-saksdata.md#fakta-og-vurdering-hver-sin-mal`,
   `../monstre/05-felt-og-saksdata.md#nokkel-og-etikett`, `../monstre/07-flyt.md#flyt-saksdata-adresse`
   Blir: `oppsett/case-data-templates/`
4. **Lag instansfeltet på saken**, så svar senere finner saken.
   Regler: `../monstre/11-integrasjoner.md#korrelasjon-paa-instans`, `../monstre/05-felt-og-saksdata.md#et-felt-har-en-leser`
   Blir: `oppsett/custom-fields/`
5. **Bygg inntaksflyten**: hendelse, skjemadata, oppslag fra maskinverdi til nøkkel, sak, part, saksdata, instans,
   substatus. En ukjent verdi eller et flertreff stopper synlig. Sakstittelen har ikke personnavn når saken arkiveres
   uten skjerming.
   Regler: `../monstre/11-integrasjoner.md#altinn-inntak`, `../monstre/07-flyt.md#flyt-tabell-for-oppslag`,
   `../monstre/07-flyt.md#flyt-hendelsen-gir-id`, `../monstre/07-flyt.md#flyt-en-node-en-effekt`,
   `../monstre/07-flyt.md#flyt-stopp-med-melding`, `../monstre/00-navn-pakking-og-versjoner.md#navn-sakstype-forst`,
   `../monstre/11-integrasjoner.md#offentlig-tittel-uten-navn`
   Blir: `oppsett/workflows/`
6. **Finn eller opprett parten** og hent det registrene vet om den
   ([Opplysninger fra registre og kart](registre-og-kart.md)).
   Regler: `../monstre/07-flyt.md#flyt-kontakt-bruk-den-som-finnes`,
   `../monstre/11-integrasjoner.md#registre-skriver-pa-kontakten`
   Blir: `oppsett/workflows/`
7. **Journalfør innsendingen i inntaket**, og la én flyt eie opprettelsen av saksmappen
   ([Journalføring og offentlig journal](journalforing-og-offentlig-journal.md)).
   Regler: `../monstre/11-integrasjoner.md#altinn-journalfores-i-inntaket`,
   `../monstre/11-integrasjoner.md#en-som-oppretter-saksmappen`
   Blir: `oppsett/workflows/`
8. **Ikke kvitter søknaden i inntaket.** Den kvitteres når saken er ferdig for den.
   Regler: `../monstre/11-integrasjoner.md#kvitter-ved-avslutning`
   Blir: `oppsett/workflows/`
9. **Sett flomvernet** på inntaksflyten når mange søknader kommer rett før en frist.
   Regler: `../monstre/07-flyt.md#flyt-flomvern`
   Blir: `oppsett/workflows/`
10. **Aktiver flyten.**
    Regler: `../monstre/07-flyt.md#flyt-aktivering`
    Blir: steg i Neo: aktiver inntaksflyten

## Hvem gjør hva

- **Deterministisk:** inntaket fra hendelsen til saken, oppslagene, parten, instansen og journalføringen.
- **Agenten** foreslår verdier i felt med KI-forslag. Saksbehandleren godtar eller avviser.
- **Mennesket** avtaler kontrakten med appen, og retter oppsettet når en ukjent verdi stopper inntaket.

## Avhengighetene

- Krever [Grunnoppsettet for en sakstype](grunnoppsett-for-sakstypen.md): valgene med nøkler, parten som sakspart og
  saksdatamalen for grunnlaget.
- [Opplysninger fra registre og kart](registre-og-kart.md): parten og registeroppslagene.
- [Journalføring og offentlig journal](journalforing-og-offentlig-journal.md): hvem som oppretter saksmappen.
- [Innhenting fra parten med et Altinn-skjema](innhenting-med-altinn-skjema.md),
  [Mangel og dialog med parten](mangel-og-dialog.md) og
  [Oppfølging med rapporter og frister](oppfolging-med-rapporter-og-frister.md) bruker instansfeltet og en egen app per
  innsending. Planlegg appene samlet.
- [Endring og klage](endring-og-klage.md): en klage i Altinn kommer inn med denne oppskriften, som en ny klagesak.
- [Innsikt og nøkkeltall](innsikt-og-nokkeltall.md): «mottatt» telles på `case.created`, brutt ned på variantfeltet.

## Grensene

- Neos skjemavisning krever innlogging i Neo, så den kan ikke brukes av søkere
  (`../monstre/10-skjema-og-innboks.md#altinn-for-soknader`).
- Altinn-kanalen i innboksen er ikke koblet til Altinn; inntaket går fra hendelsen rett til saken
  (`../monstre/10-skjema-og-innboks.md#innboks-for-det-ustrukturerte`).
- En flyt på en hendelse starter innen et minutt, ikke straks (`../monstre/07-flyt.md#flyt-hendelse-er-ikke-straks`).
- En innsending som gjelder en annen sak, som en klage på et vedtak, blir en ny sak. Relasjonen til den andre saken
  lages av et menneske, ikke av flyten (`../monstre/04-relasjoner.md#relasjoner-lages-av-mennesker`), og den kan ikke
  knyttes til en avsluttet sak i dag.
