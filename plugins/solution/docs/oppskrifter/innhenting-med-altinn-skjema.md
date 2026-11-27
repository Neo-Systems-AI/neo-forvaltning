# Innhenting fra parten med et Altinn-skjema

Saken trenger noe fra parten: en aksept av et tilsagn, en ettersending, en uttalelse, en rapport eller en klage.
Saksbehandleren sender et skjema i Altinn, og saken venter til svaret kommer eller fristen går ut. Svaret kommer inn
som strukturerte data, finner riktig sak og brukes videre i saksbehandlingen.

## Når den passer

Når kravene sier at parten skal svare, bekrefte, sende inn eller rapportere noe på en sak som alt finnes, og at saken
ikke kan gå videre før svaret er kommet. Mennesket bestemmer at forespørselen skal ut. Flyten sender den, venter og tar
imot svaret.

Den passer ikke for den første søknaden, som oppretter saken; bruk [Søknad inn fra Altinn](soknad-inn-fra-altinn.md).
Den passer heller ikke for svar som kommer som e-post eller brev; bruk
[Henvendelse inn fra e-post og innboks](henvendelse-inn-fra-epost-og-innboks.md). Er vedtaket og et tilsagn samme
dokument uten noe parten må gjøre, står tilsagnet i vedtaksmalen (`../monstre/09-maler.md#mal-brev-etter-vedtaket`).

## Klossene

handling på saken, oppgaven eller dokumentet → flyt: forhåndsutfylt skjema i Altinn og lenken i søknadens tråd →
instansen i et felt på saken → ventestatus og venteoppgave med frist → svaret inn som hendelse på strømmen → flyt:
finn saken på instansen, legg svaret i saksdata, kvitter ut venteoppgaven, sett saken videre.

- Appen i Altinn, én per slag innsending.
- Forespørselen ut: handlingen og flyten som sender det forhåndsutfylte skjemaet.
- Instansen på saken: et tekstfelt per slag forespørsel.
- Ventestatusen, venteoppgaven og fristen, og oppgaven når fristen er ute.
- Svaret inn: strømmen filtrert på appen, og flyten som oppdaterer saken.
- Brevet som følger forespørselen, når det trengs.

## Slik bygges den

1. **Avtal kontrakten med appen i Altinn**: én app per slag innsending, med feltene som forhåndsutfylles og
   maskinverdiene i hvert valg. Abonnementet på appen opprettes under integrasjonen i Neo.
   Regler: `../monstre/11-integrasjoner.md#altinn-kontrakten`, `../monstre/11-integrasjoner.md#en-app-per-innsending`,
   `../monstre/10-skjema-og-innboks.md#altinn-for-soknader`
   Blir: steg i Neo: koble appen til integrasjonen og opprett abonnementet. Appen selv lages i Altinn.
2. **Lag feltet for instansen** på saken, ett per slag forespørsel.
   Regler: `../monstre/11-integrasjoner.md#korrelasjon-paa-instans`, `../monstre/05-felt-og-saksdata.md#et-felt-har-en-leser`
   Blir: `oppsett/custom-fields/`
3. **Velg ventestatusen.** Under behandlingen er det den ene «Venter på svar». Etter vedtaket får saken en egen
   ventestatus når parten må gjøre noe før saken går videre, for eksempel «Venter på aksept av tilsagn».
   Regler: `../monstre/02-status.md#en-ventestatus`, `../monstre/02-status.md#venting-etter-vedtaket`,
   `../monstre/02-status.md#kategori-med-vilje`
   Blir: `oppsett/case-types/`
4. **Lag venteoppgaven** for hvert slag forespørsel, med fristen svaret ventes innen.
   Regler: `../monstre/06-oppgaver.md#oppgave-venter`, `../monstre/06-oppgaver.md#oppgave-milepael`,
   `../monstre/06-oppgaver.md#oppgave-frist`
   Blir: `oppsett/task-template-sets/`
5. **Send forespørselen fra en handling.** Flyten sender et forhåndsutfylt skjema til den som eier søknaden, legger
   lenken i søknadens tråd, lagrer den nye instansen i feltet, setter saken i ventestatus og lager venteoppgaven. Står
   en venteoppgave av samme slag alt åpen, stopper flyten. Følger det et brev med egne vilkår, fryses det til PDF og
   journalføres før sending.
   Regler: `../monstre/07-flyt.md#flyt-forvaltningshandling`, `../monstre/11-integrasjoner.md#ettersending-som-skjema`,
   `../monstre/11-integrasjoner.md#dialogen-er-soknadens`, `../monstre/07-flyt.md#flyt-oppgaven-finnes`,
   `../monstre/09-maler.md#mal-fryses-ved-utsending`, `../monstre/11-integrasjoner.md#utgaende-journalfores-for-sending`
   Blir: `oppsett/workflows/`, og steg i Neo: aktiver flyten.
6. **Ta imot svaret som en hendelse.** Strømmen har én hendelsestype per app, og flyten lytter på den. Flyten finner
   saken med «Finn sak» på instansfeltet, legger svaret i saksdata og journalfører det.
   Regler: `../monstre/11-integrasjoner.md#en-app-per-innsending`, `../monstre/11-integrasjoner.md#korrelasjon-paa-instans`,
   `../monstre/11-integrasjoner.md#altinn-journalfores-i-inntaket`, `../monstre/05-felt-og-saksdata.md#fakta-og-vurdering-hver-sin-mal`
   Blir: `oppsett/workflows/`, og steg i Neo: legg hendelsestypen til strømmen.
7. **La flyten oppdatere saken.** Den kvitterer ut venteoppgaven, kvitterer innsendingen i Altinn, og setter saken
   tilbake til behandling bare når ingen annen venteoppgave står åpen.
   Regler: `../monstre/07-flyt.md#flyt-ventestatus`, `../monstre/11-integrasjoner.md#kvitter-ved-avslutning`
   Blir: `oppsett/workflows/`
8. **Skriv en egen hendelse** når forespørselen er sendt og når svaret er kommet, om det skal telles.
   Regler: `../monstre/07-flyt.md#flyt-egen-hendelse`, `../monstre/13-innsikt.md#tall-krever-hendelse`
   Blir: `oppsett/flow-event-types/`
9. **Gi saksbehandleren valget når fristen går ut uten svar.** Flyten som sendte forespørselen, venter med «Vent» til
   fristen er ute, leser venteoppgaven på nytt med «Hent oppgaver», og lager oppgaven «Fristen er ute: <hva det ventes
   på>» hvis venteoppgaven fortsatt er åpen. Saksbehandleren velger mellom å purre med en ny frist og å avgjøre saken på
   det som foreligger. Varselet før fristen kommer fra venteoppgaven, ikke fra flyten.
   Regler: `../monstre/06-oppgaver.md#frist-ute-gir-oppgave`, `../monstre/06-oppgaver.md#frist-varsles-av-neo`,
   `../monstre/07-flyt.md#flyt-handling-leser-objektet`
   Blir: `oppsett/workflows/` og `oppsett/task-template-sets/`

## Eksempel: tilsagn og avtale etter vedtaket

Etter vedtaket må parten akseptere et tilsagn med vilkår, eller signere en avtale. Beløpet er et tallfelt på saken;
utbetalingsplanen og vilkårene er rader i saksdata (`../monstre/05-felt-og-saksdata.md#velg-felttype`,
`../monstre/05-felt-og-saksdata.md#flere-rader-er-saksdata`). Tilsagnsbrevet er et eget brev med dokumentfelt, uten å
gjenta begrunnelsen (`../monstre/09-maler.md#mal-brev-etter-vedtaket`, `../monstre/09-maler.md#mal-dokumentfelt`).
Flyten sender brevet og akseptskjemaet, setter saken i «Venter på aksept av tilsagn» og lager venteoppgaven med
akseptfristen. Aksepten kommer som en egen innsending som finner saken på instansen. Skal avtalen signeres, skjer
det utenfor flyten (se Grensene). Hendelsen `tilsagn.gitt` skrives når tilsagnet er sendt.

## Hvem gjør hva

- **Deterministisk:** forespørselen i Altinn, lenken i tråden, instansfeltet, ventestatusen, venteoppgaven, mottaket av
  svaret, journalføringen, kvitteringen og hendelsen.
- **Agenten:** kan skrive utkast til brevet som følger forespørselen, og oppsummere svaret i saksdata.
- **Mennesket:** bestemmer at forespørselen skal ut, setter fristen og vilkårene, vurderer et svar med forbehold, og
  velger mellom purring med ny frist og avgjørelse på det som foreligger når fristen er ute.

## Avhengighetene

- Bygger på [Grunnoppsett for sakstypen](grunnoppsett-for-sakstypen.md) og
  [Søknad inn fra Altinn](soknad-inn-fra-altinn.md): søknadens instans og tråd.
- Brukes av [Mangel og dialog](mangel-og-dialog.md) (ettersending),
  [Foreløpig svar og forhåndsvarsel](forelopig-svar-og-forhandsvarsel.md) (uttalelse),
  [Oppfølging med rapporter og frister](oppfolging-med-rapporter-og-frister.md) (rapport) og
  [Endring og klage](endring-og-klage.md) (klage).
- Etter [Vedtak med begrunnelse](vedtak-med-begrunnelse.md) for tilsagn og avtale. Fører til
  [Overlevering til et eksternt system](overlevering-til-eksternt-system.md).
- [Journalføring og offentlig journal](journalforing-og-offentlig-journal.md): forespørselen er utgående, svaret
  inngående journalpost.
- [Innsikt og nøkkeltall](innsikt-og-nokkeltall.md): hendelsene må skrives av flyten for å kunne telles.

## Grensene

- Bare én forespørsel av samme slag kan stå ute om gangen; instansfeltet er ett felt
  (`../monstre/11-integrasjoner.md#ettersending-som-skjema`).
- En `frist` som er bundet til en tom verdi, stopper noden (`../monstre/11-integrasjoner.md#ettersending-som-skjema`).
- Malen kan ikke gjenta en rad per vilkår eller utbetaling (`../monstre/09-maler.md#mal-ingen-lister`).
- Neo har ingen node for eSignering ennå, så en avtale som skal signeres, kan ikke sendes til signering fra flyten.
  Tilgangen til eSignering har egen behandlingstid hos Digdir ([eSignering](../esignering.md)).
